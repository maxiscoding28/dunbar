package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

type Contact struct {
	Name string `json:"name"`
	Date string `json:"date"`
}

var db *sql.DB

func withCORS(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
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

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS contacts (
		name TEXT NOT NULL CHECK(length(name) <= 50),
		date TIMESTAMP NOT NULL
	);`)
	if err != nil {
		log.Fatal(err)
	}

	http.HandleFunc("/create", withCORS(createContact))
	http.HandleFunc("/edit", withCORS(editContact))
	http.HandleFunc("/delete", withCORS(deleteContact))
	http.HandleFunc("/list", withCORS(listContacts))

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func createContact(w http.ResponseWriter, r *http.Request) {
	var c Contact
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	log.Printf("Received contact: %+v\n", c)
	_, err := db.Exec("INSERT INTO contacts (name, date) VALUES (?, ?)", c.Name, c.Date)
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
	_, err := db.Exec("UPDATE contacts SET date = ? WHERE name = ?", c.Date, c.Name)
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
	rows, err := db.Query("SELECT name, date FROM contacts")
	if err != nil {
		http.Error(w, "Failed to list contacts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var contacts []Contact
	for rows.Next() {
		var c Contact
		if err := rows.Scan(&c.Name, &c.Date); err != nil {
			http.Error(w, "Error reading contact", http.StatusInternalServerError)
			return
		}
		contacts = append(contacts, c)
	}
	json.NewEncoder(w).Encode(contacts)
}
