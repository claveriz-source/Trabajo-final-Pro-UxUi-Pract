document.addEventListener('DOMContentLoaded', () => {
	const hamburger = document.querySelector('.hamburger');
	const navLinks = document.querySelector('.nav-links');

	if (!hamburger || !navLinks) return;

	hamburger.addEventListener('click', () => {
		const expanded = hamburger.getAttribute('aria-expanded') === 'true';
		hamburger.setAttribute('aria-expanded', String(!expanded));
		navLinks.classList.toggle('open');
	});

	// Cerrar menú al hacer clic en un enlace (útil en móvil)
	navLinks.querySelectorAll('a').forEach(link => {
		link.addEventListener('click', () => {
			navLinks.classList.remove('open');
			hamburger.setAttribute('aria-expanded', 'false');
		});
	});

	// Carrusel simple: autoplay, controles y dots
	const carousel = document.querySelector('.carousel');
	if (carousel) {
		const track = carousel.querySelector('.carousel-track');
		const slides = Array.from(track.querySelectorAll('.slide'));
		const prevBtn = carousel.querySelector('.carousel-btn.prev');
		const nextBtn = carousel.querySelector('.carousel-btn.next');
		const dotsNav = carousel.querySelector('.carousel-dots');
		let current = 0;
		let intervalId = null;

		// crear dots
		slides.forEach((_, i) => {
			const btn = document.createElement('button');
			btn.setAttribute('aria-label', `Ir a la diapositiva ${i+1}`);
			if (i === 0) btn.classList.add('active');
			dotsNav.appendChild(btn);
			btn.addEventListener('click', () => {
				goToSlide(i);
				resetAutoplay();
			});
		});

		function goToSlide(index) {
			current = (index + slides.length) % slides.length;
			const offset = -current * carousel.offsetWidth;
			track.style.transform = `translateX(${offset}px)`;
			updateDots();
		}

		function updateDots() {
			const dots = Array.from(dotsNav.children);
			dots.forEach((d, i) => d.classList.toggle('active', i === current));
		}

		function nextSlide() { goToSlide(current + 1); }
		function prevSlide() { goToSlide(current - 1); }

		nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
		prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });

		// autoplay
		function startAutoplay() {
			// autoplay más lento: cambiar a 6000ms (6s)
			intervalId = setInterval(nextSlide, 6000);
		}
		function stopAutoplay() { clearInterval(intervalId); }
		function resetAutoplay() { stopAutoplay(); startAutoplay(); }

		carousel.addEventListener('mouseenter', stopAutoplay);
		carousel.addEventListener('mouseleave', startAutoplay);

		// ajustar al cambiar tamaño
		window.addEventListener('resize', () => goToSlide(current));

		// iniciar
		goToSlide(0);
		startAutoplay();
	}

	/* ---------------- Carrito de compras (cliente) ---------------- */
	const CART_KEY = 'pagina3d_cart_v1';
	function readCart() {
		try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
		catch(e) { return []; }
	}
	function writeCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

	function getCartCount() {
		const cart = readCart();
		return cart.reduce((s,i)=> s + (i.qty||0), 0);
	}

	function renderCartToggleCount() {
		document.querySelectorAll('.cart-count').forEach(el => el.textContent = getCartCount());
	}

	// create cart panel and overlay dynamically
	function createCartPanel() {
		if (document.querySelector('.cart-panel')) return;
		const panel = document.createElement('aside'); panel.className = 'cart-panel';
		panel.innerHTML = `
			<div class="cart-header">
				<strong>Carrito</strong>
				<button class="close-cart" aria-label="Cerrar">✕</button>
			</div>
			<div class="cart-items"></div>
			<div class="cart-footer">
				<div class="cart-total">Total: $<span class="total-value">0.00</span></div>
				<div style="margin-top:8px;">
					<button class="boton checkout">Ir a pagar</button>
				</div>
			</div>
		`;
		const overlay = document.createElement('div'); overlay.className = 'cart-overlay';
		document.body.appendChild(panel);
		document.body.appendChild(overlay);

		overlay.addEventListener('click', () => closeCart());
		panel.querySelector('.close-cart').addEventListener('click', () => closeCart());
	}

	function openCart() {
		createCartPanel();
		document.querySelector('.cart-panel').classList.add('open');
		document.querySelector('.cart-overlay').classList.add('open');
		renderCart();
	}
	function closeCart() {
		const p = document.querySelector('.cart-panel'); if (p) p.classList.remove('open');
		const o = document.querySelector('.cart-overlay'); if (o) o.classList.remove('open');
	}

	function addToCart(product) {
		const cart = readCart();
		const existing = cart.find(i => i.id === product.id);
		if (existing) existing.qty += 1; else cart.push({...product, qty: 1});
		writeCart(cart);
		renderCartToggleCount();
	}

	function removeFromCart(id) {
		let cart = readCart(); cart = cart.filter(i=> i.id !== id); writeCart(cart); renderCart(); renderCartToggleCount();
	}

	function updateQty(id, qty) {
		const cart = readCart(); const it = cart.find(i=>i.id===id); if (!it) return; it.qty = Math.max(0, Math.floor(qty)); writeCart(cart); renderCart(); renderCartToggleCount();
	}

	function renderCart() {
		createCartPanel();
		const panel = document.querySelector('.cart-panel');
		const itemsEl = panel.querySelector('.cart-items'); itemsEl.innerHTML = '';
		const cart = readCart();
		if (!cart.length) {
			itemsEl.innerHTML = '<div class="cart-empty">Tu carrito está vacío</div>';
		} else {
			cart.forEach(item => {
				const div = document.createElement('div'); div.className = 'cart-item';
				div.innerHTML = `
					<img src="${item.image||'imagenes/images.jpeg'}" alt="${item.name}">
					<div class="item-info">
						<div style="font-weight:700">${item.name}</div>
						<div style="color:#666">$${Number(item.price).toFixed(2)}</div>
					</div>
					<div>
						<input class="qty" type="number" min="0" value="${item.qty}" aria-label="Cantidad">
						<div style="text-align:right; margin-top:6px;"><button class="boton remove" data-id="${item.id}">Eliminar</button></div>
					</div>
				`;
				itemsEl.appendChild(div);
				// listeners
				div.querySelector('.qty').addEventListener('change', (e)=> updateQty(item.id, Number(e.target.value)||0));
				div.querySelector('.remove').addEventListener('click', ()=> removeFromCart(item.id));
			});
		}
		const total = cart.reduce((s,i)=> s + (i.qty * Number(i.price)), 0);
		panel.querySelector('.total-value').textContent = total.toFixed(2);
		// bind checkout button inside panel (navega a la página de checkout)
		const checkoutBtn = panel.querySelector('.checkout');
		if (checkoutBtn) checkoutBtn.addEventListener('click', () => { window.location.href = 'cart.html'; });
	}

	// bind cart toggle buttons (header)
	document.addEventListener('click', (e)=>{
		const t = e.target.closest('.cart-toggle');
		if (t) { openCart(); }
	});

	// bind add-to-cart buttons
	document.querySelectorAll('.add-to-cart').forEach(btn => {
		btn.addEventListener('click', () => {
			const id = btn.dataset.id || btn.getAttribute('data-id');
			const name = btn.dataset.name || btn.getAttribute('data-name') || btn.closest('.product-card')?.dataset?.name;
			const price = btn.dataset.price || btn.getAttribute('data-price') || btn.closest('.product-card')?.dataset?.price || '0.00';
			const img = btn.closest('.product-card')?.querySelector('img')?.src || 'imagenes/images.jpeg';
			addToCart({id, name, price: Number(price), image: img});
		});
	});

	// initial render of count
	renderCartToggleCount();
});
