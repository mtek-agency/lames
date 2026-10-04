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

	app.OnRecordCreateRequest("knives").BindFunc(stripImagesExif)
	app.OnRecordUpdateRequest("knives").BindFunc(stripImagesExif)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// imageFields liste les champs fichier de `knives` servis publiquement, donc
// soumis au stripping EXIF (§7.1 CDCF).
var imageFields = []string{"photos", "hero_image"}

// stripImagesExif re-encode chaque image nouvellement uploadée avant sauvegarde :
// decoder en pixels puis ré-encoder élimine tout l'EXIF/GPS, l'image.Image
// intermédiaire ne portant aucune métadonnée (§7.1 CDCF).
func stripImagesExif(e *core.RecordRequestEvent) error {
	for _, field := range imageFields {
		if err := stripFieldExif(e.Record, field); err != nil {
			return err
		}
	}

	return e.Next()
}

// stripFieldExif remplace, dans la valeur brute du champ, chaque fichier non
// encore sauvegardé par sa version nettoyée. Les noms de fichiers déjà en base
// sont conservés tels quels : ré-affecter uniquement les nouveaux uploads
// (`Set(field, cleaned)`) effacerait les photos existantes lors d'un ajout
// sur une pièce déjà créée.
func stripFieldExif(record *core.Record, field string) error {
	if len(record.GetUnsavedFiles(field)) == 0 {
		return nil
	}

	var items []any
	switch raw := record.GetRaw(field).(type) {
	case []any:
		items = raw
	case nil:
		return nil
	default:
		items = []any{raw}
	}

	result := make([]any, 0, len(items))

	for _, item := range items {
		f, ok := item.(*filesystem.File)
		if !ok {
			result = append(result, item)
			continue
		}

		clean, err := stripFileExif(f)
		if err != nil {
			return err
		}

		result = append(result, clean)
	}

	record.Set(field, result)

	return nil
}

func stripFileExif(f *filesystem.File) (*filesystem.File, error) {
	reader, err := f.Reader.Open()
	if err != nil {
		log.Printf("stripFileExif: open %q: %v", f.OriginalName, err)
		return nil, err
	}

	img, decodeErr := imaging.Decode(reader, imaging.AutoOrientation(true))
	closeErr := reader.Close()
	if decodeErr != nil {
		log.Printf("stripFileExif: decode %q: %v", f.OriginalName, decodeErr)
		return nil, decodeErr
	}
	if closeErr != nil {
		log.Printf("stripFileExif: close %q: %v", f.OriginalName, closeErr)
		return nil, closeErr
	}

	// PNG conservé en PNG : c'est le format des visuels détourés (`hero_image`),
	// dont la transparence serait perdue en JPEG.
	format, err := imaging.FormatFromFilename(f.OriginalName)
	if err != nil {
		format = imaging.JPEG
	}

	var buf bytes.Buffer
	if err := imaging.Encode(&buf, img, format, imaging.JPEGQuality(90)); err != nil {
		log.Printf("stripFileExif: encode %q: %v", f.OriginalName, err)
		return nil, err
	}

	clean, err := filesystem.NewFileFromBytes(buf.Bytes(), f.OriginalName)
	if err != nil {
		log.Printf("stripFileExif: rebuild file %q: %v", f.OriginalName, err)
		return nil, err
	}

	return clean, nil
}
