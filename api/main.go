package main

import (
	"bytes"
	"log"

	"github.com/disintegration/imaging"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/jsvm"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

func main() {
	app := pocketbase.New()

	// Charge pb_hooks/*.pb.js (dédup de slug, §7.2) et pb_migrations/*.js (§4).
	jsvm.MustRegister(app, jsvm.Config{})

	// Applique automatiquement les migrations au démarrage (équivalent du
	// comportement par défaut du binaire officiel `pocketbase serve`).
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		TemplateLang: migratecmd.TemplateLangJS,
		Automigrate:  true,
	})

	app.OnRecordCreateRequest("knives").BindFunc(stripPhotosExif)
	app.OnRecordUpdateRequest("knives").BindFunc(stripPhotosExif)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// stripPhotosExif re-encode chaque photo nouvellement uploadée avant sauvegarde :
// decoder en pixels puis ré-encoder élimine tout l'EXIF/GPS, l'image.Image
// intermédiaire ne portant aucune métadonnée (§7.1 CDCF).
func stripPhotosExif(e *core.RecordRequestEvent) error {
	uploaded := e.Record.GetUploadedFiles("photos")
	if len(uploaded) == 0 {
		return e.Next()
	}

	cleaned := make([]*filesystem.File, 0, len(uploaded))

	for _, f := range uploaded {
		reader, err := f.Reader.Open()
		if err != nil {
			log.Printf("stripPhotosExif: open %q: %v", f.OriginalName, err)
			return err
		}

		img, decodeErr := imaging.Decode(reader, imaging.AutoOrientation(true))
		closeErr := reader.Close()
		if decodeErr != nil {
			log.Printf("stripPhotosExif: decode %q: %v", f.OriginalName, decodeErr)
			return decodeErr
		}
		if closeErr != nil {
			log.Printf("stripPhotosExif: close %q: %v", f.OriginalName, closeErr)
			return closeErr
		}

		format, err := imaging.FormatFromFilename(f.OriginalName)
		if err != nil {
			format = imaging.JPEG
		}

		var buf bytes.Buffer
		if err := imaging.Encode(&buf, img, format, imaging.JPEGQuality(90)); err != nil {
			log.Printf("stripPhotosExif: encode %q: %v", f.OriginalName, err)
			return err
		}

		clean, err := filesystem.NewFileFromBytes(buf.Bytes(), f.OriginalName)
		if err != nil {
			log.Printf("stripPhotosExif: rebuild file %q: %v", f.OriginalName, err)
			return err
		}

		cleaned = append(cleaned, clean)
	}

	e.Record.Set("photos", cleaned)

	return e.Next()
}
