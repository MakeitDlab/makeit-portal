// Make it Digital - Kanban Board e Logica Dati Condivisa

document.addEventListener('DOMContentLoaded', () => {
    
    // ======== SIMULAZIONE DATABASE (LocalStorage) ========
    const DB_KEY = 'make_it_digital_jobs_db';
    
    // Inizializza o carica i dati
    function loadJobs() {
        const data = localStorage.getItem(DB_KEY);
        if (data) return JSON.parse(data);
        
        // Dati finti dimostrativi iniziali (solo se il db è vuoto)
        return [
            { id: "RX-409", tag: "SDIMatrix", tagClass: "tag-sdimatrix", patient: "Rossi Mario", doctor: "Dr. Bianchi - Studio ABCD", time: "09:30", status: "ricevuto" },
            { id: "RX-410", tag: "Protesi Fissa", tagClass: "tag-protesi", patient: "Verdi Elena", doctor: "Clinica Sorriso", time: "11:15", status: "ricevuto" },
            { id: "RX-405", tag: "Dispositivo ATM", tagClass: "tag-atm", patient: "Gialli Luca", doctor: "Studio D'Amico", time: "Ieri", status: "cad" }
        ];
    }

    function saveJobs(jobsArray) {
        localStorage.setItem(DB_KEY, JSON.stringify(jobsArray));
    }

    // Variabile Globale contenente tutti i lavori in base al DB
    window.AppJobs = loadJobs();

    // Se ci troviamo sulla Kanban Board (il contenitore .kanban-board esiste)
    const board = document.querySelector('.kanban-board');
    if (board) {
        renderKanban();
        setupDragAndDrop();
    }

    // Funzione per cancellare la roba hardcoded e sostituirla con quella reale
    function renderKanban() {
        // Pulisci le colonne
        document.querySelectorAll('.col-content').forEach(col => col.innerHTML = '');
        
        // Riempi in base allo status
        window.AppJobs.forEach(job => {
            const cardHTML = `
            <div class="job-card" draggable="true" data-id="${job.id}">
              <div class="job-top">
                <span class="tag ${job.tagClass}">${job.tag}</span>
                <span class="job-id">#${job.id}</span>
              </div>
              <h4>${job.patient}</h4>
              <p class="doctor">${job.doctor}</p>
              <div class="job-bottom">
                <span class="date">Ricevuto: ${job.time}</span>
                <i class="fa-solid fa-file-zipper" title="Vedi File allegati"></i>
              </div>
            </div>`;
            
            const col = document.querySelector(`.col-content[data-status="${job.status}"]`);
            if (col) col.insertAdjacentHTML('beforeend', cardHTML);
        });
        updateCounts();
    }

    // ======== LOGICA DRAG & DROP ========
    function setupDragAndDrop() {
        let draggedItem = null;
        const dropZones = document.querySelectorAll('.col-content');

        // Usa delegazione degli eventi per elementi creati dinamicamente
        board.addEventListener('dragstart', function(e) {
            if (e.target.classList.contains('job-card')) {
                draggedItem = e.target;
                setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
            }
        });

        board.addEventListener('dragend', function(e) {
            if (e.target.classList.contains('job-card')) {
                e.target.style.opacity = '1';
                draggedItem = null;
                updateCounts();
            }
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });

            zone.addEventListener('dragleave', function() {
                this.classList.remove('dragover');
            });

            zone.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                
                if (draggedItem) {
                    this.appendChild(draggedItem);
                    const newStatus = this.getAttribute('data-status');
                    const jobId = draggedItem.getAttribute('data-id');
                    
                    // Aggiorna Database Globale!
                    const jobIndex = window.AppJobs.findIndex(j => j.id === jobId);
                    if (jobIndex > -1) {
                        window.AppJobs[jobIndex].status = newStatus;
                        saveJobs(window.AppJobs);
                    }
                    
                    draggedItem.style.transform = 'scale(1.05)';
                    setTimeout(() => draggedItem.style.transform = 'scale(1)', 200);
                }
            });
        });
    }

    function updateCounts() {
        const dropZones = document.querySelectorAll('.col-content');
        dropZones.forEach(zone => {
            const count = zone.querySelectorAll('.job-card').length;
            const countElement = zone.previousElementSibling.querySelector('.count');
            if (countElement) countElement.textContent = count;
        });
    }


    // ======== LOGICA UPLOAD CLNICHE (upload.html) ========
    const btnInviaCaso = document.getElementById('btn-invia-caso');
    if (btnInviaCaso) {
        btnInviaCaso.addEventListener('click', function(e) {
            e.preventDefault();
            
            const pzInput = document.getElementById('in-paziente').value;
            const tipoMenu = document.getElementById('in-tipo');
            const tipoLabel = tipoMenu.options[tipoMenu.selectedIndex].text;
            
            if(!pzInput) {
                alert("Inserisci il nome del paziente/riferimento!");
                return;
            }

            // Mappatura Tag
            let tagCss = 'tag-protesi';
            if(tipoLabel.includes("SDIMatrix") || tipoLabel.includes("ATM")) tagCss = 'tag-sdimatrix';
            
            // Crea un ID Fake
            const rId = 'RX-' + Math.floor(Math.random() * 900 + 100);
            
            // Creiamo il nuovo Lavoro nel Cloud-Locale Simulate
            const newJob = {
                id: rId,
                tag: tipoLabel.substring(0, 15)+'...',
                tagClass: tagCss,
                patient: pzInput,
                doctor: "Dr. Sorriso (Te stesso da Upload)",
                time: new Date().toLocaleTimeString().slice(0,5),
                status: "ricevuto"
            };

            // Salvataggio VERO in Locale!
            const currentDb = loadJobs();
            currentDb.push(newJob);
            saveJobs(currentDb);

            // Conferma visiva
            alert(`✅ Caso SDiMatrix inviato correttamente a Tony! Puoi aprire la Dashboard per vedere l'ID ${rId} nei 'Ricevuti'!`);
            document.getElementById('in-paziente').value = ""; // Pulisci Box
        });
    }

    // ======== LOGICA MODALE NUOVO LAVORO (Dashboard) ========
    const btnOpenModal = document.getElementById('btn-open-modal');
    const modal = document.getElementById('modal-new-job');
    const btnCloseModal = document.getElementById('close-modal');
    const formNewJob = document.getElementById('form-new-job');

    if (btnOpenModal && modal) {
        btnOpenModal.addEventListener('click', () => {
            modal.classList.add('active');
        });

        btnCloseModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Chiudi se clicchi fuori dal contenuto
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        formNewJob.addEventListener('submit', (e) => {
            e.preventDefault();

            const patient = document.getElementById('new-job-patient').value;
            const doctor = document.getElementById('new-job-doctor').value;
            const typeMenu = document.getElementById('new-job-type');
            const typeValue = typeMenu.value;
            const typeLabel = typeMenu.options[typeMenu.selectedIndex].text;

            // Mappatura Tag CSS
            let tagCss = 'tag-protesi';
            if (typeValue === 'sdimatrix') tagCss = 'tag-sdimatrix';
            if (typeValue === 'atm') tagCss = 'tag-atm';

            const newJob = {
                id: 'RX-' + Math.floor(Math.random() * 900 + 100),
                tag: typeLabel.split(' - ')[0], // Prendi la parte corta
                tagClass: tagCss,
                patient: patient,
                doctor: doctor,
                time: "Adesso",
                status: "ricevuto"
            };

            // Salva e Rendi
            window.AppJobs.unshift(newJob);
            saveJobs(window.AppJobs);
            renderKanban();

            // Reset e Chiudi
            formNewJob.reset();
            modal.classList.remove('active');
            
            // Feedback Visivo Mini
            console.log("Nuovo lavoro creato:", newJob);
        });
    }

    // ======== LOGICA DATABASE EXPLORER (Visualizza Dati) ========
    const btnShowData = document.getElementById('btn-show-data');
    const modalData = document.getElementById('modal-data');
    const closeData = document.getElementById('close-modal-data');
    const dataDisplay = document.getElementById('data-raw');
    const btnDownload = document.getElementById('btn-download-data');
    const btnCopy = document.getElementById('btn-copy-data');

    if (btnShowData) {
        btnShowData.addEventListener('click', (e) => {
            e.preventDefault();
            const currentJobs = localStorage.getItem(DB_KEY) || '[]';
            dataDisplay.textContent = JSON.stringify(JSON.parse(currentJobs), null, 4);
            modalData.classList.add('active');
        });

        closeData.addEventListener('click', () => modalData.classList.remove('active'));

        btnCopy.addEventListener('click', () => {
            const data = dataDisplay.textContent;
            navigator.clipboard.writeText(data).then(() => {
                alert("Database copiato nella negli appunti!");
            });
        });

        btnDownload.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(dataDisplay.textContent);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "lab_database_backup.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }

});
