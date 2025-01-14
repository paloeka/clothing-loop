package views

import (
	"bytes"
	"errors"
	"html/template"
	"io/fs"
	"net/http"

	"github.com/CollActionteam/clothing-loop/server/internal/app/gin_utils"
	glog "github.com/airbrake/glog/v4"
	"github.com/gin-gonic/gin"
)

func mustParseFS(fs fs.FS, patterns ...string) *template.Template {
	templ, err := template.ParseFS(fs, patterns...)
	if err != nil {
		glog.Fatalf("Unable to convert files to template %e", err)
		return nil
	}
	return templ
}

func executeTemplate(c *gin.Context, t *template.Template, name string, data any) (string, error) {
	buf := new(bytes.Buffer)
	err := t.ExecuteTemplate(buf, name, data)
	if err != nil {
		glog.Error(err)
		gin_utils.GinAbortWithErrorBody(c, http.StatusInternalServerError, errors.New("Unable to find template"))
		return "", err
	}

	return buf.String(), nil
}
