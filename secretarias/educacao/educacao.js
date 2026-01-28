/* =======================================================================
   EDUCACAO.JS - DASHBOARD E GRÁFICOS OTIMIZADOS
   Descrição: Scripts específicos para a página de Educação (SJM).
   ======================================================================= */

// --- 1. CONFIGURAÇÃO GLOBAL E DADOS ---

const COLORS = {
    green: '#009039',
    yellow: '#FDC806',
    blue: '#00A8E8',
    purple: '#8E44AD',
    pink: '#E91E63',
    darkBlue: '#0056b3',
    gray: '#CCCCCC',
    text: '#AAA',
    grid: 'rgba(255, 255, 255, 0.05)'
};

// Dados Estáticos (Armazenados aqui por enquanto)
const DB = {
    ideb: { 
        iniciais: { labels: ['05', '07', '09', '11', '13', '15', '17', '19', '21', '23'], datasets: [{ label: 'Anos Iniciais', data: [3.7, 3.6, 4.0, 4.2, 4.5, 4.5, 4.6, 4.9, 4.6, 4.9], backgroundColor: COLORS.blue, borderRadius: 4 }] },
        finais: { labels: ['05', '07', '09', '11', '13', '15', '17', '19', '21', '23'], datasets: [{ label: 'Anos Finais', data: [2.6, 2.5, 3.5, 3.5, 3.2, 3.8, 3.5, 3.6, 4.1, 4.2], backgroundColor: COLORS.yellow, borderRadius: 4 }] }
    },
    matriculas: {
        infantil: { labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'], datasets: [{ label: 'Pré-escola', data: [68.0, 68.5, 69.0, 69.5, 70.0, 70.4, 70.8], backgroundColor: COLORS.blue, borderRadius: 4 }, { label: 'Creche', data: [32.0, 31.5, 31.0, 30.5, 30.0, 29.6, 29.2], backgroundColor: COLORS.green, borderRadius: 4 }] },
        fundamental: { labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'], datasets: [{ label: 'Anos Iniciais', data: [56.8, 56.8, 56.3, 56.9, 57.9, 57.9, 58.5], backgroundColor: COLORS.purple, borderRadius: 4 }, { label: 'Anos Finais', data: [43.2, 43.2, 43.7, 43.1, 42.1, 42.1, 41.5], backgroundColor: COLORS.yellow, borderRadius: 4 }] }
    },
    taxas: {
        distorcao: { labels: ['18', '19', '20', '21', '22', '23', '24'], datasets: [{ label: 'Fundamental', data: [29.8, 29.1, 28.4, 27.6, 26.9, 26.1, 25.4], backgroundColor: COLORS.green }, { label: 'Médio', data: [24.9, 24.3, 23.7, 23.1, 22.5, 21.9, 21.3], backgroundColor: COLORS.yellow }] },
        abandono: { labels: ['18', '19', '20', '21', '22', '23', '24'], datasets: [{ label: 'Fundamental', data: [2.04, 1.88, 1.72, 1.56, 1.40, 1.25, 1.10], backgroundColor: COLORS.green }, { label: 'Médio', data: [3.08, 3.09, 3.10, 3.11, 3.13, 3.14, 3.16], backgroundColor: COLORS.pink }] }
    },
    enem: { 
        "2023": { "genero": [{ label: "Masculino", data: [344, 349, 313, 355], backgroundColor: COLORS.blue }, { label: "Feminino", data: [315, 349, 301, 350], backgroundColor: COLORS.pink }], "administracao": [{ label: "Federal", data: [529, 507, 435, 510], backgroundColor: COLORS.darkBlue }, { label: "Municipal", data: [101, 141, 100, 130], backgroundColor: COLORS.yellow }] } 
    },
    comparativo: { 
        labels: ['2017', '2018', '2019', '2020', '2021', '2022', '2023'], 
        datasets: [
            { label: 'Brasil', data: [500.4, 514.4, 491.2, 232.8, 339.7, 349.8, 354.1], borderColor: COLORS.green, borderDash: [5, 5] },
            { label: 'Rio de Janeiro', data: [542.5, 557.8, 534.1, 261.2, 374.5, 387.2, 360.6], borderColor: COLORS.blue },
            { label: 'São João De Meriti', data: [511.7, 529.1, 503.2, 218.9, 333.5, 349.2, 332.8], borderColor: COLORS.yellow, borderWidth: 4 }
        ]
    }
};

// Replica dados do ENEM para anos anteriores (Mockup)
["2017", "2018", "2019", "2020", "2021", "2022"].forEach(y => DB.enem[y] = JSON.parse(JSON.stringify(DB.enem["2023"])));


// --- 2. INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    // Configura defaults do Chart.js uma única vez
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = COLORS.text;
    Chart.defaults.scale.grid.color = COLORS.grid;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0,0,0,0.9)';
    Chart.defaults.plugins.tooltip.titleColor = COLORS.yellow;

    initScrollAnimation();
    initKpiCounters();
    initLoaderSystem(); 
});


/* =======================================================================
   3. SISTEMA DE LOADERS (Efeito Tech)
   ======================================================================= */

function initLoaderSystem() {
    const cards = document.querySelectorAll('.analise-card');
    let chartsInitialized = false;

    cards.forEach(card => {
        card.classList.add('is-loading');
        // Adiciona loader tech via JS
        card.insertAdjacentHTML('beforeend', `<div class="loader-container"><div class="tech-loader"></div></div>`);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const loader = card.querySelector('.loader-container');
                observer.unobserve(card);

                // Delay de 2s para simular processamento
                setTimeout(() => {
                    if(loader) loader.style.opacity = '0';
                    card.classList.remove('is-loading');
                    card.classList.add('is-loaded');

                    setTimeout(() => { if(loader) loader.remove(); }, 500);

                    // Inicia gráficos apenas na primeira visualização
                    if (!chartsInitialized) {
                        initAllCharts();
                        chartsInitialized = true;
                    }
                }, 2000);
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => observer.observe(card));
}


/* =======================================================================
   4. FABRICA DE GRÁFICOS
   ======================================================================= */

function initAllCharts() {
    // 1. Evolução Matrículas (Gradiente)
    createEvolucaoChart();

    // 2. IDEB (Barras com Labels)
    createDynamicBarChart('chartIdeb', 'filterIdebType', DB.ideb, (val) => val.toFixed(1));

    // 3. Taxas de Rendimento
    createDynamicBarChart('chartTaxasRendimento', 'filterTaxasType', DB.taxas, (val) => val.toFixed(1) + '%');

    // 4. Distribuição Matrículas
    createDynamicBarChart('chartMatriculas', 'filterMatriculasType', DB.matriculas, (val) => val.toFixed(1) + '%');

    // 5. ENEM (Barras)
    if(document.getElementById('chartEnem')) createEnemChart('chartEnem', 'filterEnemYear', 'filterEnemCategory');
    if(document.getElementById('chartEnem2')) createEnemChart('chartEnem2', 'filterEnemYear2', 'filterEnemCategory2');

    // 6. ENEM (Comparativo Linhas)
    if(document.getElementById('chartEnemComparativo')) createLineComparison('chartEnemComparativo', '.mun-checkbox');
    if(document.getElementById('chartEnemComparativo2')) createLineComparison('chartEnemComparativo2', '.mun-checkbox-2');

}

// --- HELPER: Cria Plugin de Labels (Números em cima das barras) ---
const createLabelPlugin = (formatter) => ({
    id: 'customLabels',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
                meta.data.forEach((el, index) => {
                    const val = dataset.data[index];
                    if(val && val > 0) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = 'bold 10px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(formatter(val), el.x, el.y - 5);
                    }
                });
            }
        });
        ctx.restore();
    }
});


// --- GRÁFICOS ESPECÍFICOS ---

function createEvolucaoChart() {
    const ctx = document.getElementById('chartEvolucaoMatriculas');
    if(!ctx) return;
    
    // Gradiente bonito
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 168, 232, 0.5)'); 
    gradient.addColorStop(1, 'rgba(0, 168, 232, 0.0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
            datasets: [{
                label: 'Total de Matrículas', data: [26188, 26363, 26009, 26119, 27895, 28499, 28377],
                borderColor: COLORS.blue, backgroundColor: gradient, borderWidth: 3,
                pointBackgroundColor: '#FFF', pointBorderColor: COLORS.blue, pointRadius: 5, fill: true, tension: 0.4
            }]
        },
        plugins: [createLabelPlugin((v) => v.toLocaleString('pt-BR'))],
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } }, y: { display: false } }
        }
    });
}

function createDynamicBarChart(canvasId, filterId, dataSource, formatFn) {
    const ctx = document.getElementById(canvasId);
    if(!ctx) return;

    // Pega primeira chave do objeto de dados para inicializar
    const initialKey = Object.keys(dataSource)[0];
    const initialData = dataSource[initialKey];

    const chart = new Chart(ctx, {
        type: 'bar',
        data: { labels: initialData.labels, datasets: initialData.datasets },
        plugins: [createLabelPlugin(formatFn)],
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: COLORS.gray } } },
            scales: { x: { grid: { display: false } }, y: { display: true, grid: { color: COLORS.grid } } }
        }
    });

    // Configura o filtro (Select)
    const filter = document.getElementById(filterId);
    if(filter) {
        filter.addEventListener('change', function() {
            const newData = dataSource[this.value];
            if(newData) {
                chart.data.labels = newData.labels;
                chart.data.datasets = newData.datasets;
                chart.update();
                updateDescription(this, this.value); // Atualiza texto se necessário
            }
        });
    }
}

function createEnemChart(canvasId, yearId, catId) {
    const ctx = document.getElementById(canvasId);
    if(!ctx) return;

    const chart = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Matemática', 'Linguagens', 'Humanas', 'Sociais'], datasets: DB.enem["2023"]["genero"] },
        plugins: [createLabelPlugin((v) => v)],
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: COLORS.gray } } },
            scales: { x: { grid: { display: false } }, y: { display: true, grace: '10%' } }
        }
    });

    const update = () => {
        const y = document.getElementById(yearId)?.value || "2023";
        const c = document.getElementById(catId)?.value || "genero";
        const data = DB.enem[y] && DB.enem[y][c] ? DB.enem[y][c] : DB.enem["2023"][c];
        chart.data.datasets = data;
        chart.update();
    };

    document.getElementById(yearId)?.addEventListener('change', update);
    document.getElementById(catId)?.addEventListener('change', update);
}

function createLineComparison(canvasId, checkboxSelector) {
    const ctx = document.getElementById(canvasId);
    if(!ctx) return;

    const chart = new Chart(ctx, {
        type: 'line',
        data: { labels: DB.comparativo.labels, datasets: DB.comparativo.datasets.map(d => ({...d, tension: 0.4})) },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } } }
        }
    });

    document.querySelectorAll(checkboxSelector).forEach(box => {
        box.addEventListener('change', (e) => {
            const ds = chart.data.datasets.find(d => d.label === e.target.value);
            if(ds) {
                const idx = chart.data.datasets.indexOf(ds);
                chart.setDatasetVisibility(idx, e.target.checked);
                chart.update();
            }
        });
    });
}

// --- UTILITÁRIOS VISUAIS ---

function updateDescription(element, value) {
    // Lógica simples para trocar texto descritivo baseado no filtro
    // Pode ser expandida conforme necessidade
    const desc = element.closest('.sebrae-info')?.querySelector('.info-description');
    if(!desc) return;
    
    // Exemplo genérico de feedback visual
    // desc.style.opacity = 0.5; setTimeout(() => desc.style.opacity = 1, 300);
}

function initScrollAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { 
            if (entry.isIntersecting) { 
                entry.target.style.opacity = 1; 
                entry.target.style.transform = 'translateY(0)'; 
            } 
        });
    });
    document.querySelectorAll('.section-title, .hero-content').forEach(el => { 
        el.style.opacity = 0; 
        el.style.transform = 'translateY(20px)'; 
        el.style.transition = 'all 0.6s ease-out'; 
        observer.observe(el); 
    });
}

function initKpiCounters() {
    document.querySelectorAll('.count-up').forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const updateCount = () => {
            const current = +counter.innerText.replace(/\./g, '');
            const inc = Math.max(1, Math.ceil(target / 100));
            if (current < target) {
                counter.innerText = (current + inc).toLocaleString('pt-BR');
                requestAnimationFrame(updateCount);
            } else {
                counter.innerText = target.toLocaleString('pt-BR');
            }
        };
        updateCount();
    });
}

/* =======================================================================
   EDUCACAO.JS - CORRIGIDO
   ======================================================================= */

/* ... (Mantenha todo o código de CONFIGURAÇÃO, DADOS e INICIALIZAÇÃO igual estava antes) ... */

/* --- COLE ISSO NO FINAL DO SEU ARQUIVO EDUCACAO.JS (FORA DE OUTRAS FUNÇÕES) --- */

/* FUNÇÃO DO MENU MOBILE (Global) */
function toggleMenu() {
    const nav = document.getElementById('navMenu');
    if (nav) {
        nav.classList.toggle('active'); // Abre/Fecha o menu
    }
}

// Fecha o menu automaticamente ao clicar em um link
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-menu a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.getElementById('navMenu');
            if (nav) nav.classList.remove('active');
        });
    });
});