
const container = document.getElementById('products-container');


window.toggleDetails = function (btn) {
    const card = btn.closest('.card-wrapper');
    const imgBlock = card.querySelector('.img-block');
    const innerDesc = card.querySelector('.inner-desc');
    const descBlock = card.querySelector('.desc-block');

    if (btn.textContent === 'Ver menos') {
        imgBlock.style.height = '240px';
        imgBlock.style.opacity = '1';
        innerDesc.classList.add('line-clamp-2');
        descBlock.classList.remove('overflow-y-auto', 'pr-2', 'custom-scrollbar');
        btn.textContent = 'Ver mais';
    } else {
        imgBlock.style.height = '0px';
        imgBlock.style.opacity = '0';
        innerDesc.classList.remove('line-clamp-2');
        descBlock.classList.add('overflow-y-auto', 'pr-2', 'custom-scrollbar');
        btn.textContent = 'Ver menos';
    }
};

products.forEach(product => {

    const buttonHtml = product.hotmart_checkout_url
        ? `<a href="${product.hotmart_checkout_url}" target="_blank" class="w-full text-center bg-white text-slate-900 text-sm font-bold py-3.5 px-4 rounded-xl transition-colors duration-300 hover:bg-slate-200 block">
            Acesso Imediato
           </a>`
        : `<button disabled class="w-full text-center bg-slate-800 text-slate-500 text-sm font-bold py-3.5 px-4 rounded-xl cursor-not-allowed block border border-slate-700">
            Não Disponível
           </button>`;

    const shareHtml = product.hotmart_checkout_url
        ? `<button onclick="handleShare(event, '${product.name}', '${product.hotmart_checkout_url}')"
            class="flex items-center justify-center bg-white text-slate-900 hover:bg-slate-200 text-xs font-bold py-3.5 px-4 rounded-xl transition-colors duration-300 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
        </button>`
        : `<button disabled class="flex items-center justify-center bg-slate-800 text-slate-600 text-xs font-bold py-3.5 px-4 rounded-xl cursor-not-allowed shrink-0 border border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
        </button>`;

    const cardHtml = `
        <div class="card-wrapper group relative bg-slate-900 rounded-3xl border border-slate-800 flex flex-col transition-all duration-300 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/50 h-[480px] max-h-[480px] w-full sm:w-[350px] max-w-[400px] overflow-hidden">
            <div class="img-block relative w-full bg-slate-800 select-none shrink-0 flex justify-center transition-all duration-700 ease-in-out overflow-hidden" style="height: 240px; opacity: 1;">
                <img src="${product.image_url}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" onerror="this.onerror=null;this.src='https://i.sstatic.net/y9DpT.jpg'">
            </div>
            
            <div class="p-6 flex-1 flex flex-col bg-slate-900 relative z-10 border-t border-slate-800 text-justify min-h-0">
                <div class="flex-1 flex flex-col w-full min-h-0">
                    <h3 class="product-title font-semibold text-slate-50 mb-2 leading-snug group-hover:text-slate-300 transition-colors w-full block shrink-0 truncate overflow-hidden whitespace-nowrap" title="${product.name}">
                        ${product.name}
                    </h3>
                    <div class="desc-block text-sm text-slate-400 font-light leading-relaxed flex-1 flex flex-col w-full relative text-justify min-h-0">
                        <span class="inner-desc line-clamp-2 transition-all duration-300">
                            ${product.description}
                        </span>
                    </div>
                    <div class="flex items-center justify-between mt-2 shrink-0">
                        <button onclick="toggleDetails(this)" class="text-[11px] text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer outline-none">Ver mais</button>
                        <p class="text-[10px] text-slate-500 flex items-center gap-1">
                            <svg class="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            Garantia de 21 dias
                        </p>
                    </div>
                </div>
                
                <div class="mt-3 relative z-20 shrink-0 w-full">
                    <div class="flex gap-2">
                        ${buttonHtml}
                        ${shareHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML += cardHtml;
});
