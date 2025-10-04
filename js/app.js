let books = [];

async function loadBooks(){
  const res = await fetch('books.json');
  books = await res.json();
  renderBooks(books);
}

function renderBooks(list){
  const grid = document.getElementById('books-grid');
  grid.innerHTML = list.map(b => `
    <article class="card">
      <img src="${b.cover}" alt="${b.title} cover" />
      <h3>${b.title}</h3>
      <p>${b.author}</p>
      <div class="card-actions">
        <a href="${b.file}" download>Download</a>
        <a href="viewer.html?file=${encodeURIComponent(b.file)}" target="_blank">Read</a>
      </div>
    </article>
  `).join('');
}

document.getElementById('search').addEventListener('input', e=>{
  const q = e.target.value.toLowerCase();
  renderBooks(books.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    (b.tags || []).some(t => t.includes(q))
  ));
});

loadBooks();
