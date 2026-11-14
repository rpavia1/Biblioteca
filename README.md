# Biblioteca de Rubén

Aplicación web y base de datos bibliográfica desarrollada bajo criterios de **biblioteconomía y documentación** (control de autoridades de autor, CDU jerárquica y esquemas OPAC), diseñada para funcionar de forma **100% autónoma, sin dependencias de servidor**, accesible localmente en el ordenador y preparada para **GitHub Pages** (móvil y tablet).

---

## 📁 Estructura del Proyecto

```text
Biblioteca/
├── index.html              # Aplicación web principal (SPA responsiva)
├── css/
│   └── styles.css          # Estilos profesionales OPAC (tarjetas, tablas, modal y print)
├── js/
│   ├── data.js             # Base de datos completa embebida (855 libros, compatible file:// y web)
│   └── app.js              # Lógica interactiva (CRUD, ordenación CDU, impresión y cotejo BNE)
├── data/
│   └── biblioteca.json     # Base de datos estructurada en formato JSON puro
├── Biblioteca.xlsx         # Archivo Excel original
└── README.md               # Documentación y guía de uso
```

---

## 🚀 Cómo Abrir y Consultar la Web

1. **En tu ordenador (Uso inmediato local):**
   * Haz doble clic directamente sobre [`index.html`](file:///c:/Users/Rubén/Dropbox/ANTIGRAVITY/Biblioteca/index.html) para abrirlo en tu navegador predeterminado (Chrome, Edge, Firefox, etc.).
   * Funciona de forma instantánea sin necesidad de instalar servidores ni ejecutar comandos en terminal.

2. **En tu teléfono móvil o tablet (Vía GitHub Pages):**
   * Sube este repositorio a tu cuenta de GitHub.
   * En la configuración del repositorio (`Settings` > `Pages`), selecciona la rama principal `main` y la carpeta raíz `/ (root)`.
   * Tendrás una URL pública inmediata para consultar tu biblioteca desde cualquier lugar en el móvil.

---

## 🧹 Corrección de Redundancias en la Interfaz

Siguiendo tus indicaciones, se ha separado limpiamente la información:
* **Cabecera superior:** Muestra exclusivamente el progreso de lectura personal (🟢 Leídos: 209 | 🟠 Empezados: 39 | ⚪ Pendientes: 607). Al pulsar cualquiera de estas tres pastillas, se filtra el catálogo al instante por ese estado de lectura.
* **Barra de filtros inferior:** Muestra exclusivamente las tipologías documentales del catálogo (Todos | 📚 Solo Libros | 🗯️ Cómics | 🖨️ Impresos | ⚠️ Revisión manual), eliminando la duplicidad.

---

## 🔍 Funcionalidades de la FASE 3 (Revisión y Cotejo Bibliográfico)

### a) Cotejo Libro por Libro (Desde la Ficha Individual)
* Al abrir la ficha de cualquier libro, encontrarás el bloque **`🔍 Cotejo Bibliográfico (BNE / OpenLibrary / Google Books)`**.
* Pulsa **`🌐 Consultar Internet`**:
  * La aplicación consulta en tiempo real bases de datos públicas abiertas.
  * Muestra una comparativa visual clara:
    * **Tus datos:** Año registrado, Editorial y Código CDU.
    * **Datos públicos encontrados:** Años de edición detectados, Editorial comercial y Clasificaciones temáticas (Dewey / Materias).
    * **Insignia de estado:** Indica si el año coincide exactamente (`✓ Coincide`), si hay discrepancias de edición (`⚠️ Discrepancia de año / Múltiples ediciones`) o si no hay datos abiertos automáticos.
  * **Acciones directas:**
    * **`🏛️ Abrir en Catálogo BNE ↗`**: Abre en una pestaña nueva la búsqueda pre-cumplimentada en el catálogo oficial de la Biblioteca Nacional de España.
    * **`✏️ Aplicar Año`**: Si se detecta un año de publicación oficial y deseas adoptarlo, lo actualiza con un solo clic.
    * **`✓ Confirmar como Verificado`**: Da por bueno el registro y retira cualquier aviso de revisión.
    * **`⚠️ Marcar para Revisión Manual`**: Añade al libro la etiqueta destacada **`⚠️ Revisión manual`** para que lo revises físicamente en la estantería.

### b) Revisión en Lote Pequeño (Lotes de 5 libros de Terrassa)
* En la cabecera dispones del botón **`🔍 Revisar Terrassa`**.
* Abre una ventana dedicada que procesa secuencialmente los libros de Terrassa en **lotes pequeños de 5 en 5**:
  * Muestra una tabla comparativa libro a libro con los datos de tu catálogo frente a los datos públicos.
  * En cada fila dispones de:
    * Enlace directo a la **BNE**.
    * Botón **`⚠️ Marcar Duda`** (asigna la etiqueta de revisión manual).
    * Botón **`✓ Validar`**.
  * Botones **`← Lote anterior`** y **`Siguiente lote →`** para avanzar ordenadamente sin saturar.

### c) Filtro de Libros Pendientes de Revisión
* En la barra de filtros tienes el botón **`⚠️ Revisión manual`**: filtra al instante todos los libros marcados con dudas o pendientes de revisión física, mostrando el contador exacto de libros señalados.
