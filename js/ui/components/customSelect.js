/**
 * CUSTOMSELECT.JS - COMPONENTE PREMIUM DE DROPDOWN CUSTOMIZADO
 * 
 * Substitui o menu nativo básico do sistema operativo por um dropdown
 * flutuante com estética iOS Glassmorphism, animações suaves, scrollbar personalizada
 * e suporte a optgroups litúrgicos, sincronizado com o elemento <select> subjacente.
 */

import { escapeHtml } from '../../domain/formatters.js';

let activeOpenShell = null;

// Fecha qualquer dropdown aberto ao clicar fora ou pressionar Escape
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        if (activeOpenShell && !activeOpenShell.contains(e.target)) {
            closeCustomSelect(activeOpenShell);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeOpenShell) {
            closeCustomSelect(activeOpenShell);
        }
    });
}

/**
 * Inicializa ou sincroniza dropdowns customizados em todos os seletores
 * @param {string|Element} [target] - Seletor CSS ou elemento específico
 */
export function initCustomSelects(target) {
    if (typeof document === 'undefined') return;

    let selects;
    if (typeof HTMLSelectElement !== 'undefined' && target instanceof HTMLSelectElement) {
        selects = [target];
    } else if (typeof target === 'string') {
        selects = Array.from(document.querySelectorAll(target));
    } else {
        selects = Array.from(document.querySelectorAll('select.readings-dropdown, select[data-custom-select]'));
    }

    selects.forEach(select => {
        setupSingleCustomSelect(select);
    });
}

/**
 * Configura um único elemento <select>
 */
function setupSingleCustomSelect(select) {
    if (!select || !select.parentElement) return;

    const shell = select.closest('.readings-select-shell');
    if (!shell) return;

    // Se já estiver configurado, apenas sincroniza as opções e rótulo
    if (shell.dataset.customSelectInitialized === 'true') {
        renderCustomOptions(select, shell);
        updateTriggerDisplay(select, shell);
        return;
    }

    shell.dataset.customSelectInitialized = 'true';

    // Oculta o select nativo visualmente mantendo-o acessível a formulários e scripts
    select.classList.add('custom-select-native-hidden');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');

    // Cria o botão acionador (trigger) que ocupa o shell
    let trigger = shell.querySelector('.custom-select-trigger');
    if (!trigger) {
        trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'custom-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-label', select.getAttribute('aria-label') || 'Selecionar opção');
        
        const textSpan = document.createElement('span');
        textSpan.className = 'custom-select-trigger-text';
        trigger.appendChild(textSpan);

        shell.insertBefore(trigger, shell.firstChild);
    }

    // Cria o popover flutuante
    let popover = shell.querySelector('.custom-select-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.className = 'custom-select-popover is-hidden';
        popover.setAttribute('role', 'listbox');
        
        const scroller = document.createElement('div');
        scroller.className = 'custom-select-options-scroller';
        popover.appendChild(scroller);

        shell.appendChild(popover);
    }

    // Renderiza as opções
    renderCustomOptions(select, shell);
    updateTriggerDisplay(select, shell);

    // Evento de clique no Trigger
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCustomSelect(shell, select);
    });

    // Se clicar no chevron, abre também
    const chevron = shell.querySelector('.readings-chevron-box');
    if (chevron) {
        chevron.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCustomSelect(shell, select);
        });
    }

    // Ouvinte no select nativo: quando o valor muda por script, atualiza o trigger e opções
    select.addEventListener('change', () => {
        updateTriggerDisplay(select, shell);
        updateActiveOptionInPopover(select, shell);
    });

    // Observa alterações no DOM do select (ex: novos options inseridos dinamicamente)
    const observer = new MutationObserver(() => {
        renderCustomOptions(select, shell);
        updateTriggerDisplay(select, shell);
    });
    observer.observe(select, { childList: true, subtree: true });
}

/**
 * Abre ou fecha o dropdown customizado
 */
function toggleCustomSelect(shell, select) {
    const popover = shell.querySelector('.custom-select-popover');
    if (!popover) return;

    const isOpen = !popover.classList.contains('is-hidden');
    if (isOpen) {
        closeCustomSelect(shell);
    } else {
        openCustomSelect(shell, select);
    }
}

function openCustomSelect(shell, select) {
    // Fecha qualquer outro dropdown aberto
    if (activeOpenShell && activeOpenShell !== shell) {
        closeCustomSelect(activeOpenShell);
    }

    const popover = shell.querySelector('.custom-select-popover');
    const trigger = shell.querySelector('.custom-select-trigger');
    if (!popover || !trigger) return;

    popover.classList.remove('is-hidden');
    shell.classList.add('is-open');
    const container = shell.closest('.readings-search-card, .readings-selectors-stack, .readings-selectors-bar, .readings-control-card, .readings-panel-card');
    if (container) container.classList.add('has-dropdown-open');
    trigger.setAttribute('aria-expanded', 'true');
    activeOpenShell = shell;

    // Rola suavemente para a opção atualmente selecionada
    const selectedItem = popover.querySelector('.custom-select-option.is-selected');
    if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
    }
}

function closeCustomSelect(shell) {
    if (!shell) return;
    const popover = shell.querySelector('.custom-select-popover');
    const trigger = shell.querySelector('.custom-select-trigger');
    if (popover) popover.classList.add('is-hidden');
    shell.classList.remove('is-open');
    const container = shell.closest('.readings-search-card, .readings-selectors-stack, .readings-selectors-bar, .readings-control-card, .readings-panel-card');
    if (container) container.classList.remove('has-dropdown-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (activeOpenShell === shell) {
        activeOpenShell = null;
    }
}

/**
 * Renderiza os optgroups e options dentro do popover customizado
 */
function renderCustomOptions(select, shell) {
    const scroller = shell.querySelector('.custom-select-options-scroller');
    if (!scroller || !select) return;

    scroller.innerHTML = '';

    const currentValue = select.value;
    const children = Array.from(select.children);

    children.forEach(child => {
        if (child.tagName === 'OPTGROUP') {
            const groupWrap = document.createElement('div');
            groupWrap.className = 'custom-select-optgroup';

            const groupHeader = document.createElement('div');
            groupHeader.className = 'custom-select-optgroup-header';
            groupHeader.textContent = child.label;
            groupWrap.appendChild(groupHeader);

            Array.from(child.children).forEach(opt => {
                if (opt.tagName === 'OPTION') {
                    groupWrap.appendChild(createOptionElement(opt, currentValue, select, shell));
                }
            });

            scroller.appendChild(groupWrap);
        } else if (child.tagName === 'OPTION') {
            scroller.appendChild(createOptionElement(child, currentValue, select, shell));
        }
    });
}

function createOptionElement(opt, currentValue, select, shell) {
    const isSelected = opt.value === currentValue;
    const item = document.createElement('div');
    item.className = `custom-select-option ${isSelected ? 'is-selected' : ''}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    item.dataset.value = opt.value;

    item.innerHTML = `
        <span class="custom-select-option-text">${escapeHtml(opt.text)}</span>
    `;

    item.addEventListener('click', (e) => {
        e.stopPropagation();
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        updateTriggerDisplay(select, shell);
        updateActiveOptionInPopover(select, shell);
        closeCustomSelect(shell);
    });

    return item;
}

function updateTriggerDisplay(select, shell) {
    const textSpan = shell.querySelector('.custom-select-trigger-text');
    if (!textSpan || !select) return;

    const selectedOption = select.options[select.selectedIndex];
    textSpan.textContent = selectedOption ? selectedOption.text : '';
}

function updateActiveOptionInPopover(select, shell) {
    const popover = shell.querySelector('.custom-select-popover');
    if (!popover || !select) return;

    const val = select.value;
    popover.querySelectorAll('.custom-select-option').forEach(item => {
        const isSelected = item.dataset.value === val;
        item.classList.toggle('is-selected', isSelected);
        item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
}

/**
 * Força atualização de um select específico externamente
 */
export function syncCustomSelect(selectEl) {
    if (!selectEl) return;
    const shell = selectEl.closest('.readings-select-shell');
    if (shell) {
        renderCustomOptions(selectEl, shell);
        updateTriggerDisplay(selectEl, shell);
        updateActiveOptionInPopover(selectEl, shell);
    }
}
