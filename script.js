/* =======================================================================
   SCRIPT.JS - LÓGICA CENTRAL
   ======================================================================= */

// --- 1. DADOS E CONFIGURAÇÕES ---
let appData = {
    populacao: { 2010: 458673, 2022: 440962 },
    salario: 1.7,
    pib: 18935.50,
    densidade: 12521.64
};

let chartInstances = []; 

const COLORS = {
    green: '#009039', yellow: '#FDC806', blue: '#0056b3', gray: '#AAA', grid: 'rgba(255, 255, 255, 0.05)'
};

// --- 2. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    initThemeSystem();      // Cria a função global toggleSiteTheme
    initMobileMenu();
    initScrollAnimation();
    initCounterAnimation();
    
    // Inicia os scripts de acessibilidade (Funções definidas no outro arquivo)
    if (typeof initAccessibilityMenu === 'function') initAccessibilityMenu();
    if (typeof initAccessibilityFeatures === 'function') initAccessibilityFeatures();

    initCardLoaders();      // Carrega os gráficos
});

/* =======================================================================
   4. FUNÇÕES DE GRÁFICOS
   ======================================================================= */
function createChart(id, type, data, extraOptions = {}) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const newChart = new Chart(ctx, {
        type: type, data: data,
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } }, ...extraOptions
        }
    });
    if (typeof chartInstances !== 'undefined') chartInstances.push(newChart);
    return newChart;
}

function updateChartsTheme(isLight) {
    const textColor = isLight ? '#000000' : '#AAAAAA';
    const gridColor = isLight ? '#444444' : 'rgba(255,255,255,0.05)';
    if (window.Chart) { Chart.defaults.color = textColor; Chart.defaults.borderColor = gridColor; }
    chartInstances.forEach(chart => {
        if (chart.options) {
            chart.options.color = textColor;
            if (chart.options.scales) {
                Object.keys(chart.options.scales).forEach(scaleKey => {
                    const scale = chart.options.scales[scaleKey];
                    if (scale.grid) scale.grid.color = gridColor;
                    if (scale.ticks) scale.ticks.color = textColor;
                });
            }
        }
        chart.update(); 
    });
}

function fixChartPop(isLight) {
    const chartInstance = Chart.getChart("chartPop"); 
    if (chartInstance) {
        const novaCorTexto = isLight ? '#000000' : '#FFFFFF';
        const novaCorGrade = isLight ? '#444444' : 'rgba(255,255,255,0.1)';
        if (chartInstance.options.scales.x) {
            chartInstance.options.scales.x.ticks.color = novaCorTexto;
            chartInstance.options.scales.x.grid.color = novaCorGrade;
        }
        if (chartInstance.options.scales.y) {
            chartInstance.options.scales.y.ticks.color = novaCorTexto;
            chartInstance.options.scales.y.grid.color = novaCorGrade;
        }
        chartInstance.update();
    }
}

/* =======================================================================
   5. MENU MOBILE E ANIMAÇÕES
   ======================================================================= */
function initMobileMenu() {
    window.toggleMenu = function() {
        const nav = document.getElementById('navMenu');
        if (nav) nav.classList.toggle('active');
    };
    const links = document.querySelectorAll('.nav-menu a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.getElementById('navMenu');
            if (nav) nav.classList.remove('active');
        });
    });
}

function initScrollAnimation() {
    const elements = document.querySelectorAll('.js-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    elements.forEach(el => observer.observe(el));
}

function initCounterAnimation() {
    const numbers = document.querySelectorAll('.kpi-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const el = entry.target;
                const finalValueText = el.innerText;
                const endValue = parseFloat(finalValueText.replace(/\./g, '').replace(',', '.'));
                const isDecimal = finalValueText.includes(',');
                animateValue(el, 0, endValue, 2000, isDecimal, finalValueText);
                el.classList.add('counted');
            }
        });
    }, { threshold: 0.5 });
    numbers.forEach(el => observer.observe(el));
}

function animateValue(obj, start, end, duration, isDecimal, originalText) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = progress === 1 ? end : (1 - Math.pow(1 - progress, 3)) * end;
        obj.innerHTML = isDecimal 
            ? currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : Math.floor(currentVal).toLocaleString('pt-BR');
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = originalText;
    };
    window.requestAnimationFrame(step);
}

function initCardLoaders() {
    const cards = document.querySelectorAll('.analise-card');
    let chartsInitialized = false;
    cards.forEach(card => {
        card.classList.add('is-loading');
        const loader = document.createElement('div');
        loader.className = 'loader-container';
        loader.innerHTML = '<div class="tech-loader"></div>';
        card.appendChild(loader);
    });
    setTimeout(() => {
        document.querySelectorAll('.loader-container').forEach(l => l.remove());
        cards.forEach(c => c.classList.remove('is-loading'));
        cards.forEach(c => c.classList.add('is-loaded'));
        if (!chartsInitialized) { initAllCharts(); chartsInitialized = true; }
    }, 2000);
}
/* =======================================================================
   6. GRÁFICOS (CHART.JS)
   ======================================================================= */

function initAllCharts() {
    // Configuração Global Chart.js
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = COLORS.gray;
    Chart.defaults.scale.grid.color = COLORS.grid;

    // --- MINI GRÁFICO HOME (EDUCAÇÃO) ---
    createChart('miniChartEduHome', 'line', {
        labels: ['2021', '2022', '2023', '2024'],
        datasets: [{
            label: 'Alunos', data: [38800, 39100, 39350, 39500],
            borderColor: COLORS.yellow, borderWidth: 3,
            backgroundColor: (ctx) => createGradient(ctx, COLORS.yellow),
            fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6
        }]
    }, { scales: { x: {display: false}, y: {display: false, min: 38000} } });

    // --- 1. POPULAÇÃO ---
    createChart('chartPop', 'bar', {
        labels: ['Censo 2010', 'Censo 2022'],
        datasets: [{
            label: 'População', data: [appData.populacao[2010], appData.populacao[2022]],
            backgroundColor: [COLORS.blue, COLORS.green], borderRadius: 6, barThickness: 50
        }]
    }, { scales: { y: { beginAtZero: false, min: 400000 } } });

    // --- 2. TRABALHO ---
    createChart('chartTrab', 'bar', {
        labels: ['SJM', 'Estado RJ', 'Brasil'],
        datasets: [{
            label: 'Salários Mínimos', data: [appData.salario, 2.4, 2.2],
            backgroundColor: [COLORS.yellow, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)'],
            borderRadius: 4, barThickness: 30
        }]
    }, { indexAxis: 'y' });

    // --- 3. EDUCAÇÃO ---
    createChart('chartEdu', 'line', {
        labels: ['2019', '2020', '2021', '2022', '2023'],
        datasets: [{
            label: 'Matrículas', data: [38500, 39100, 38800, 39500, 40100],
            borderColor: COLORS.green, backgroundColor: 'rgba(0, 144, 57, 0.1)',
            fill: true, tension: 0.4, pointRadius: 4
        }]
    }, { scales: { y: { display: false } } });

    // --- 4. ECONOMIA ---
    createChart('chartEcon', 'doughnut', {
        labels: ['Serviços', 'Indústria', 'Adm. Pública', 'Agro'],
        datasets: [{
            data: [65, 15, 19.9, 0.1],
            backgroundColor: [COLORS.yellow, COLORS.blue, COLORS.green, '#999'],
            borderWidth: 0, hoverOffset: 10
        }]
    }, { cutout: '65%', plugins: { legend: { position: 'right' } } });

    // --- 5. SAÚDE ---
    createChart('chartSaude', 'line', {
        labels: ['2018', '2019', '2020', '2021'],
        datasets: [{
            label: 'Óbitos por mil', data: [15.2, 14.9, 14.88, 14.1],
            borderColor: '#FF4444', borderDash: [5, 5], pointBackgroundColor: '#FF4444', tension: 0.2
        }]
    });

    // --- 6. MEIO AMBIENTE ---
    createChart('chartAmb', 'bar', {
        labels: ['Coleta Lixo', 'Água', 'Esgoto'],
        datasets: [{
            label: 'Cobertura (%)', data: [98.7, 91.2, 64.1],
            backgroundColor: [COLORS.green, COLORS.blue, '#555'], borderRadius: 4
        }]
    }, { scales: { y: { max: 100 } } });

    // --- 7. TERRITÓRIO ---
    createChart('chartTerr', 'bar', {
        labels: ['SJM', 'Estado RJ'],
        datasets: [{
            label: 'Hab/km²', data: [12521, 365],
            backgroundColor: [COLORS.yellow, '#444'], borderRadius: 4
        }]
    }, { scales: { y: { type: 'logarithmic' } } });
}

// Helper: Cria Gradiente
function createGradient(context, color) {
    const ctx = context.chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, color.replace(')', ', 0.0)').replace('rgb', 'rgba'));
    return gradient;
}

/* =======================================================================
   7. INTERATIVIDADE (SLIDER, SCROLL, CONTADORES)
   ======================================================================= */

// Slider Horizontal
function initSlider() {
    const container = document.querySelector('.paineis-grid');
    const btnLeft = document.querySelector('.slider-arrow.left');
    const btnRight = document.querySelector('.slider-arrow.right');

    if (!container || !btnLeft || !btnRight) return;

    btnRight.addEventListener('click', () => container.scrollBy({ left: 350, behavior: 'smooth' }));
    btnLeft.addEventListener('click', () => container.scrollBy({ left: -350, behavior: 'smooth' }));
}

// Animação de Scroll (Fade In)
function initScrollAnimation() {
    const elements = document.querySelectorAll('.kpi-card, .painel-card, .section-title');
    elements.forEach(el => el.classList.add('js-scroll'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => observer.observe(el));
}

// Animação de Números (Count Up)
function initCounterAnimation() {
    const numbers = document.querySelectorAll('.kpi-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const el = entry.target;
                const finalValueText = el.innerText;
                const endValue = parseFloat(finalValueText.replace(/\./g, '').replace(',', '.'));
                const isDecimal = finalValueText.includes(',');

                animateValue(el, 0, endValue, 2000, isDecimal, finalValueText);
                el.classList.add('counted');
            }
        });
    }, { threshold: 0.5 });
    
    numbers.forEach(el => observer.observe(el));
}

function animateValue(obj, start, end, duration, isDecimal, originalText) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = progress === 1 ? end : (1 - Math.pow(1 - progress, 3)) * end;

        obj.innerHTML = isDecimal 
            ? currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : Math.floor(currentVal).toLocaleString('pt-BR');

        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = originalText;
    };
    window.requestAnimationFrame(step);
}



/* =======================================================================
   GERENCIADOR DE TEMAS (DARK / WHITE - VERSÃO ÍCONES)
   ======================================================================= */

function initThemeSystem() {
    const themeBtn = document.getElementById('theme-toggle');
    console.log("Botão de tema encontrado?", themeBtn);
    // Busca o elemento 'i' (ícone) dentro do botão
    const themeIcon = themeBtn ? themeBtn.querySelector('i') : null;
    const body = document.body;

    // Verifica preferência salva
    const savedTheme = localStorage.getItem('site_theme');
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        updateButtonState(true); 
        
        // --- CORREÇÃO: Garante que os gráficos carreguem pretos ---
        setTimeout(() => {
            if (typeof updateChartsTheme === 'function') updateChartsTheme(true);
            if (typeof fixChartPop === 'function') fixChartPop(true);
        }, 500); // Pequeno delay para dar tempo do gráfico ser criado
    } else {
        updateButtonState(false); 
    }

    // Evento de Clique
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            body.classList.toggle('light-theme');
            const isLight = body.classList.contains('light-theme');
            
            localStorage.setItem('site_theme', isLight ? 'light' : 'dark');
            updateButtonState(isLight);
            
            // Tenta atualizar os gráficos, mas não trava se der erro
            try {
                if (typeof updateChartsTheme === 'function') updateChartsTheme(isLight);
                if (typeof fixChartPop === 'function') fixChartPop(isLight);
            } catch (error) {
                console.log("Aguardando gráficos carregarem...", error);
            }
        });
    }

    // --- FUNÇÃO QUE TROCA O ÍCONE ---
    function updateButtonState(isLight) {
        if (!themeIcon) return;
        
        if (isLight) {
            // Se está CLARO, queremos a LUA (fa-moon)
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            // Se está ESCURO, queremos o SOL (fa-sun)
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }

    // Também adicione logo após verificar o tema salvo (para quando abrir o site)
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        updateButtonState(true);
        
        // ADICIONE AQUI TAMBÉM:
        setTimeout(() => updateChartsTheme(true), 100); // Pequeno delay para garantir que o gráfico carregou
    }
}

// --- FUNÇÃO PARA ATUALIZAR CORES DOS GRÁFICOS (DARK/LIGHT) ---
function updateChartsTheme(isLight) {
    // --- CONFIGURAÇÃO DE CORES ---
    
    // 1. TEXTO (Eixos X e Y):
    // Light: Preto Puro (#000000)
    // Dark:  Cinza Claro (#AAAAAA)
    const textColor = isLight ? '#000000' : '#AAAAAA';
    
    // 2. GRADE (Linhas de fundo):
    // Light: Cinza Escuro (#444444) - Para destacar no branco
    // Dark:  Transparente (rgba 255, 0.05) - Para ficar sutil no preto
    const gridColor = isLight ? '#444444' : 'rgba(255, 255, 255, 0.05)';
    
    // Aplica nos padrões globais
    if (window.Chart) {
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;
    }

    // Aplica em cada gráfico já criado
    chartInstances.forEach(chart => {
        if (chart.options) {
            chart.options.color = textColor; // Muda a cor geral do texto
            
            if (chart.options.scales) {
                Object.keys(chart.options.scales).forEach(scaleKey => {
                    const scale = chart.options.scales[scaleKey];
                    
                    // Atualiza a GRADE
                    if (scale.grid) scale.grid.color = gridColor;
                    
                    // Atualiza os VALORES X e Y (Ticks)
                    if (scale.ticks) {
                        scale.ticks.color = textColor; 
                        scale.ticks.backdropColor = 'transparent'; // Garante fundo limpo
                    }
                });
            }
        }
        chart.update(); 
    });
}

// Função Específica: Corrige o Gráfico de População
function fixChartPop(isLight) {
    const chartInstance = Chart.getChart("chartPop"); 

    if (chartInstance) {
        // --- MESMAS CORES DA FUNÇÃO ACIMA ---
        const novaCorTexto = isLight ? '#000000' : '#FFFFFF'; // Preto ou Branco
        const novaCorGrade = isLight ? '#444444' : 'rgba(255, 255, 255, 0.1)'; // Cinza ou Transparente

        // Eixo X (Horizontal)
        if (chartInstance.options.scales.x) {
            chartInstance.options.scales.x.ticks.color = novaCorTexto; // Muda cor dos números
            chartInstance.options.scales.x.grid.color = novaCorGrade;  // Muda cor da linha
        }
        
        // Eixo Y (Vertical)
        if (chartInstance.options.scales.y) {
            chartInstance.options.scales.y.ticks.color = novaCorTexto; // Muda cor dos números
            chartInstance.options.scales.y.grid.color = novaCorGrade;  // Muda cor da linha
        }

        // Legenda
        if (chartInstance.options.plugins.legend) {
            chartInstance.options.plugins.legend.labels.color = novaCorTexto;
        }

        chartInstance.update();
    }
}

// --- FUNÇÃO QUE ATUALIZA OS NÚMEROS NA TELA (KPIs) ---
function updateDashboardUI() {
    // 1. Atualiza População
    const kpiPop = document.getElementById('kpi-pop');
    if (kpiPop) {
        // Pega o valor de 2022 do nosso objeto de dados
        kpiPop.innerText = appData.populacao[2022].toLocaleString('pt-BR');
    }

    // 2. Atualiza PIB
    const kpiPib = document.getElementById('kpi-pib');
    if (kpiPib) {
        // Formata para "R$ X.XXX,XX Bi"
        kpiPib.innerText = "R$ " + appData.pib.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " Bi";
    }

    // 3. Atualiza Densidade (se existir o elemento)
    const kpiDens = document.getElementById('kpi-densidade');
    if (kpiDens) {
        kpiDens.innerText = appData.densidade.toLocaleString('pt-BR');
    }

    // 4. Atualiza Salário/Renda (se existir o elemento)
    const kpiRenda = document.getElementById('kpi-renda');
    if (kpiRenda) {
        kpiRenda.innerText = appData.salario.toLocaleString('pt-BR') + " salários";
    }
}