My E-Book Library
A simple, responsive web application for browsing and reading e-books in PDF format.

📚 Project Overview
This is a lightweight e-book library that allows users to:

Browse a collection of books with cover images

Search books by title, author, or tags

Download PDF files

Read books directly in the browser using the built-in PDF viewer

🗂️ Project Structure
```
my-ebook-library/
├── index.html          # Main application page
├── viewer.html         # PDF viewer page
├── books.json          # Book catalog data
├── css/
│   └── styles.css      # Application styles
├── js/
│   └── app.js          # Main application logic
├── covers/             # Book cover images
│   ├── កម្រងតែងសេចក្តី.jpg
│   ├── វិញ្ញាសា12.jpg
│   └── សំណួរ_ចម្លើយ_ប្រវត្តិត្រៀមប្រឡងបាក់ឌុប_2014_2019_1.jpg
└── pdfs/               # PDF book files
    ├── កម្រងតែងសេចក្តី.pdf
    ├── វិញ្ញាសា12.pdf
    └── សំណួរ_ចម្លើយ_ប្រវត្តិត្រៀមប្រឡងបាក់ឌុប_2014_2019_1.pdf
```
🚀 Features
Responsive Design: Works on desktop and mobile devices

Search Functionality: Filter books by title, author, or tags

Book Cards: Display book covers, titles, and authors in an attractive grid layout

Download Option: Direct download links for PDF files

In-browser Reading: Built-in PDF viewer for reading books without downloading

Khmer Language Support: Full support for Khmer characters in book titles and content

📖 How to Use
Open index.html in a web browser

Browse the book collection in the grid view

Use the search bar to filter books by title, author, or tags

Click "Download" to save a PDF file to your device

Click "Read" to open the book in the built-in PDF viewer

🛠️ Technical Details
Frontend: Pure HTML, CSS, and JavaScript (no frameworks required)

Data Storage: JSON file for book metadata

PDF Handling: Native browser PDF rendering

Responsive Layout: CSS Grid for book card layout

Search: Client-side filtering with case-insensitive matching

📱 Compatibility
Modern browsers with PDF support (Chrome, Firefox, Safari, Edge)

Mobile-friendly responsive design

Supports Khmer Unicode characters

📝 Adding New Books
To add new books to the library:

Add the PDF file to the pdfs/ folder

Add the cover image to the covers/ folder

Update books.json with the new book's metadata:

json
{
  "id": "unique-id",
  "title": "Book Title",
  "author": "Author Name",
  "cover": "covers/filename.jpg",
  "file": "pdfs/filename.pdf",
  "tags": ["tag1", "tag2"]
}
🌐 Deployment
This project can be deployed on any static web hosting service (GitHub Pages, Netlify, Vercel, etc.) since it consists entirely of static files.

📄 License

This project is provided as-is for educational and personal use.
