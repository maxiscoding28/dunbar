package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	_ "github.com/mattn/go-sqlite3"
)

type Contact struct {
	Name  string `json:"name"`
	Date  string `json:"date"`
	TagID *int   `json:"tag_id,omitempty"`
	Tag   string `json:"tag,omitempty"` // For display purposes
}

type Tag struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

var db *sql.DB

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		h(w, r)
	}
}

func main() {
	var err error
	db, err = sql.Open("sqlite3", "./contacts.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Create contacts table (updated to match current schema)
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS contacts (
		name TEXT NOT NULL CHECK(length(name) <= 25),
		date TIMESTAMP NOT NULL,
		tag_id INTEGER REFERENCES tags(id)
	);`)
	if err != nil {
		log.Fatal(err)
	}

	// Create tags table
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS tags (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE CHECK(length(name) <= 25)
	);`)
	if err != nil {
		log.Fatal(err)
	}

	// Contact endpoints
	http.HandleFunc("/create", withCORS(createContact))
	http.HandleFunc("/edit", withCORS(editContact))
	http.HandleFunc("/delete", withCORS(deleteContact))
	http.HandleFunc("/list", withCORS(listContacts))

	// Tag endpoints
	http.HandleFunc("/tags/create", withCORS(createTag))
	http.HandleFunc("/tags/list", withCORS(listTags))
	http.HandleFunc("/tags/get", withCORS(getTag))
	http.HandleFunc("/tags/edit", withCORS(editTag))
	http.HandleFunc("/tags/delete", withCORS(deleteTag))

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// Contact functions (updated to handle tag_id)
func createContact(w http.ResponseWriter, r *http.Request) {
	var c Contact
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	log.Printf("Received contact: %+v\n", c)

	_, err := db.Exec("INSERT INTO contacts (name, date, tag_id) VALUES (?, ?, ?)", c.Name, c.Date, c.TagID)
	if err != nil {
		http.Error(w, "Failed to create contact", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func editContact(w http.ResponseWriter, r *http.Request) {
	var c Contact
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Exec("UPDATE contacts SET date = ?, tag_id = ? WHERE name = ?", c.Date, c.TagID, c.Name)
	if err != nil {
		http.Error(w, "Failed to edit contact", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func deleteContact(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "Missing name parameter", http.StatusBadRequest)
		return
	}
	_, err := db.Exec("DELETE FROM contacts WHERE name = ?", name)
	if err != nil {
		http.Error(w, "Failed to delete contact", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func listContacts(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
		SELECT c.name, c.date, c.tag_id, t.name as tag_name 
		FROM contacts c 
		LEFT JOIN tags t ON c.tag_id = t.id
	`)
	if err != nil {
		http.Error(w, "Failed to list contacts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var contacts []Contact
	for rows.Next() {
		var c Contact
		var tagID sql.NullInt64
		var tagName sql.NullString

		if err := rows.Scan(&c.Name, &c.Date, &tagID, &tagName); err != nil {
			http.Error(w, "Error reading contact", http.StatusInternalServerError)
			return
		}

		if tagID.Valid {
			id := int(tagID.Int64)
			c.TagID = &id
		}
		if tagName.Valid {
			c.Tag = tagName.String
		}

		contacts = append(contacts, c)
	}
	json.NewEncoder(w).Encode(contacts)
}

// Tag functions
func createTag(w http.ResponseWriter, r *http.Request) {
	var t Tag
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	result, err := db.Exec("INSERT INTO tags (name) VALUES (?)", t.Name)
	if err != nil {
		http.Error(w, "Failed to create tag", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	t.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(t)
}

func listTags(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name FROM tags ORDER BY name")
	if err != nil {
		http.Error(w, "Failed to list tags", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			http.Error(w, "Error reading tag", http.StatusInternalServerError)
			return
		}
		tags = append(tags, t)
	}
	json.NewEncoder(w).Encode(tags)
}

func getTag(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id parameter", http.StatusBadRequest)
		return
	}

	var t Tag
	err = db.QueryRow("SELECT id, name FROM tags WHERE id = ?", id).Scan(&t.ID, &t.Name)
	if err == sql.ErrNoRows {
		http.Error(w, "Tag not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Failed to get tag", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(t)
}

func editTag(w http.ResponseWriter, r *http.Request) {
	var t Tag
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Exec("UPDATE tags SET name = ? WHERE id = ?", t.Name, t.ID)
	if err != nil {
		http.Error(w, "Failed to edit tag", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func deleteTag(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id parameter", http.StatusBadRequest)
		return
	}

	// First, remove this tag from all contacts
	_, err = db.Exec("UPDATE contacts SET tag_id = NULL WHERE tag_id = ?", id)
	if err != nil {
		http.Error(w, "Failed to update contacts", http.StatusInternalServerError)
		return
	}

	// Then delete the tag
	_, err = db.Exec("DELETE FROM tags WHERE id = ?", id)
	if err != nil {
		http.Error(w, "Failed to delete tag", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
