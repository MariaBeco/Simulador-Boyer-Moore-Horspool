// pie.js
// Pie de página: lista de integrantes.
(function () {
  const AUTORES = [
    { nombre: "Sara Jaimes Castañeda", correo: "sarajc@ufps.edu.co",
      linkedin: "https://www.linkedin.com/in/sara-jaimes-castañeda-930bb7338" },
    { nombre: "Maria Fernanda Becerra Coronel", correo: "mariafernandabeco@ufps.edu.co",
      linkedin: "https://www.linkedin.com/in/maria-fernanda-becerra-coronel-45311339b" }
  ];

  const lista = document.getElementById("listaAutores");
  for (const autor of AUTORES) {
    const li = document.createElement("li");
    const nombre = document.createElement("p");
    nombre.className = "font-medium";
    if (autor.linkedin) {
      const enlace = document.createElement("a");
      enlace.href = autor.linkedin;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";
      enlace.title = "Ver perfil en LinkedIn";
      enlace.className = "enlace-autor";
      enlace.textContent = autor.nombre;
      nombre.appendChild(enlace);
    } else {
      nombre.textContent = autor.nombre;
    }
    const correo = document.createElement("a");
    correo.href = "mailto:" + autor.correo;
    correo.textContent = autor.correo;
    li.append(nombre, correo);
    lista.appendChild(li);
  }
})();
