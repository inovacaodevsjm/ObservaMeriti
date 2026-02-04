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

    // --- A) TEMA DARK/LIGHT (Conectado à função global) ---
    const themeCheckbox = document.getElementById('toggle-theme');
    
     if (themeCheckbox) {
        // Sincroniza estado inicial
        themeCheckbox.checked = body.classList.contains('light-theme');

        // Ao clicar no switch...
        themeCheckbox.addEventListener('change', () => {
            // VERIFICAÇÃO DE SEGURANÇA: Chama a função global se ela existir
            if (typeof window.toggleSiteTheme === 'function') {
                window.toggleSiteTheme();
            } else {
                console.error("ERRO: A função window.toggleSiteTheme não foi encontrada no script.js!");
                // Fallback de emergência (caso o script.js falhe)
                body.classList.toggle('light-theme');
            }
        });

        // Ouve se o tema mudou por outro meio
        const observer = new MutationObserver(() => {
            themeCheckbox.checked = body.classList.contains('light-theme');
        });
        observer.observe(body, { attributes: true, attributeFilter: ['class'] });

        const features = [
        { id: 'toggle-contrast', className: 'high-contrast' },
        { id: 'toggle-grayscale', className: 'grayscale-mode' }, // <--- NOVO
        { id: 'toggle-font', className: 'font-large' },
        { id: 'toggle-motion', className: 'reduce-motion' },
        { id: 'toggle-focus', className: 'focus-visible' }
      ];

      features.forEach(feature => {
          setupToggle(feature.id, feature.className);
      });
    }

    // --- B) OUTRAS FUNCIONALIDADES ---
    setupToggle('toggle-contrast', 'high-contrast');
    setupToggle('toggle-font', 'font-large');
    setupToggle('toggle-motion', 'reduce-motion');
    setupToggle('toggle-focus', 'focus-visible');
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

