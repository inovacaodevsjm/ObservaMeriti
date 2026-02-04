/* =======================================================================
   SISTEMA DE ACESSIBILIDADE
   ======================================================================= */

function initAccessibilityMenu() {
    const btn = document.getElementById('accessibility-toggle');
    const menu = document.getElementById('accessibility-menu');

    if (!btn || !menu) return;

    btn.onclick = (e) => {
        e.stopPropagation();
        const isActive = menu.classList.contains('active');
        if (isActive) {
            menu.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        } else {
            menu.classList.add('active');
            btn.setAttribute('aria-expanded', 'true');
        }
    };

    menu.onclick = (e) => e.stopPropagation();

    document.addEventListener('click', (e) => {
        if (menu.classList.contains('active') && !btn.contains(e.target)) {
            menu.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

function initAccessibilityFeatures() {
    const body = document.body;

    const themeCheckbox = document.getElementById('toggle-theme');
    
    if (themeCheckbox) {
    // 1. Carrega o estado inicial do localStorage
    const savedTheme = localStorage.getItem('site_theme');
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        themeCheckbox.checked = true;
    }

    themeCheckbox.addEventListener('change', () => {
        const isLight = themeCheckbox.checked;
        
        if (isLight) {
            body.classList.add('light-theme');
            localStorage.setItem('site_theme', 'light');
        } else {
            body.classList.remove('light-theme');
            localStorage.setItem('site_theme', 'dark');
        }

        // Avisa os gráficos (importante para a página de educação)
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: isLight ? 'light' : 'dark' } 
        }));
    });
}

    const features = [
        { id: 'toggle-contrast', className: 'high-contrast' },
        { id: 'toggle-grayscale', className: 'grayscale-mode' },
        { id: 'toggle-font', className: 'font-large' },
        { id: 'toggle-motion', className: 'reduce-motion' },
        { id: 'toggle-focus', className: 'focus-visible' }
    ];

    features.forEach(feature => {
        setupToggle(feature.id, feature.className);
    });
}

function setupToggle(id, className) {
    const toggle = document.getElementById(id);
    if (!toggle) return;
    
    const isEnabled = localStorage.getItem(className) === 'true';
    toggle.checked = isEnabled;
    if (isEnabled) document.body.classList.add(className);

    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            document.body.classList.add(className);
            localStorage.setItem(className, 'true');
        } else {
            document.body.classList.remove(className);
            localStorage.setItem(className, 'false');
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    initAccessibilityMenu();
    initAccessibilityFeatures();
});

