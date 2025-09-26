// A single object to hold all UI selectors for better organization
const DOM = {
    mobileMenu: document.querySelector('.mobile-menu'),
    hamburgerBtn: document.querySelector('.hamburger'),
    // 🆕 NEW SELECTOR: Target the actual icon element inside the hamburger button
    hamburgerIcon: document.querySelector('.hamburger i'),
    // ❌ REMOVED: No longer need the dedicated close mobile menu button (as it will be the hamburger icon)
    // closeMobileMenuBtn: document.querySelector('.mobile-menu-close'), 
    cartIcon: document.querySelector('.cart-icon'),
    cartTab: document.querySelector('.cart-tab'),
    closeCartBtn: document.querySelector('.close-btn'),
    closeFormBtns: document.querySelectorAll('.close-form-btn'),
    // Using querySelectorAll for elements that appear multiple times (like .sign-in-btn)
    signinForm: document.querySelector('.sign-in-form'),
    registerLink: document.querySelector('.register-link'),
    registerForm: document.querySelector('.register-form'),
    cardList: document.querySelector('.card-list'),
    cartList: document.querySelector('.cart-list'),
    cartValue: document.querySelector('.cart-value'),
    cartTotal: document.querySelector('.cart-total'),
    notificationArea: document.querySelector('.notification-area'),
    accountBtn: document.querySelector('.account-btn'),
    sidebar: document.querySelector('.sidebar'),
    closeSidebarBtn: document.querySelector('.close-sidebar-btn')
};

// Application state and data
let productList = [];
let cart = [];

// Initializes Swiper.js for the testimonial slider (Assuming Swiper library is loaded)
function initSwiper() {
    if (typeof Swiper !== 'undefined') {
        new Swiper('.mySwiper', {
            loop: true,
            navigation: {
                nextEl: "#next",
                prevEl: "#prev",
            },
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
        });
    }
}

// ------------------------------------------
// 🎯 FIX 1 & 2: Update fetchProducts for 8 items and correct price parsing
// ------------------------------------------
async function fetchProducts() {
    try {
        const response = await fetch('product.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        let data = await response.json();
        
        // Convert the price string ("$9.67") from the JSON to a number (9.67) for math
        productList = data.map(p => ({
            ...p,
            price: parseFloat(p.price.replace('$', '')) 
        }));

        renderProductCards();
    } catch (error) {
        console.error('Error fetching products:', error);
        
        // 🚨 FALLBACK FIX: Includes all 8 products from product.json and ensures prices are numbers.
        productList = [
            { id: 1, name: 'Double Beef Burger', price: 9.67, image: 'images/burger.png' },
            { id: 2, name: 'Veggie Pizza', price: 10.99, image: 'images/pizza.png' },
            { id: 3, name: 'Fried Chicken', price: 13.45, image: 'images/fried-chicken.png' },
            { id: 4, name: 'Chicken Roll', price: 7.50, image: 'images/chicken-roll.png' },
            { id: 5, name: 'Sub Sandwich', price: 6.99, image: 'images/sandwich.png' },
            { id: 6, name: 'Chicken Lasagna', price: 16.45, image: 'images/lasagna.png' },
            { id: 7, name: 'Italian Spaghetti', price: 7.65, image: 'images/spaghetti.png' },
            { id: 8, name: 'Spring Roll', price: 9.31, image: 'images/spring-roll.png' }
        ];

        renderProductCards();
    }
}

// Renders the product cards on the page
function renderProductCards() {
    if (!DOM.cardList) return; 
    DOM.cardList.innerHTML = productList.map(product => `
        <div class="order-card" data-id="${product.id}">
            <div class="card-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <h4>${product.name}</h4>
            <h4 class="price">$${product.price.toFixed(2)}</h4>
            <a href="#" class="btn card-btn">Add to cart</a>
        </div>
    `).join('');
}

// Handles adding a product to the cart
function addToCart(productId) {
    const product = productList.find(item => item.id === productId);
    if (!product) return;

    const existingCartItem = cart.find(item => item.id === productId);

    if (existingCartItem) {
        if (existingCartItem.quantity >= 5) {
            showMessage(null, null, 'error');
            return;
        }
        existingCartItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    const currentQuantity = existingCartItem ? existingCartItem.quantity : 1;
    showMessage(currentQuantity, product.image, 'success');
    updateCartUI();
}

// Renders the cart items and updates totals based on the cart array
function updateCartUI() {
    if (!DOM.cartList) return; 
    
    // Clear the cart list before re-rendering
    DOM.cartList.innerHTML = '';
    
    let totalPrice = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        DOM.cartList.innerHTML = '<p style="text-align: center; color: gray; padding-top: 2rem;">Your cart is empty. Add some delicious food!</p>';
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        totalItems += item.quantity;

        const cartItemDiv = document.createElement('div');
        // Added 'flex' and 'between' classes for proper styling (as defined in your CSS)
        cartItemDiv.classList.add('item', 'flex', 'between');
        cartItemDiv.dataset.id = item.id;
        cartItemDiv.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="detail">
                <h4>${item.name}</h4>
                <h4 class="item-total">$${itemTotal.toFixed(2)}</h4>
            </div>
            <div class="flex">
                <a href="#" class="quantity-btn minus"><i class="fa-solid fa-minus"></i></a>
                <h4 class="quantity-value">${item.quantity}</h4>
                <a href="#" class="quantity-btn plus"><i class="fa-solid fa-plus"></i></a>
            </div>
        `;
        DOM.cartList.appendChild(cartItemDiv);
    });

    if (DOM.cartTotal) DOM.cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
    if (DOM.cartValue) DOM.cartValue.textContent = totalItems;
}

// ------------------------------------------
// 🎯 FIX 3: Add animation delay for item removal
// ------------------------------------------
function changeQuantity(productId, action) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    if (action === 'plus') {
        if (item.quantity >= 5) {
            showMessage(null, null, 'error');
            return;
        }
        item.quantity++;
        updateCartUI();
    } else if (action === 'minus') {
        
        // Find the specific item element to apply the slide-out effect
        const itemElement = DOM.cartList.querySelector(`.item[data-id="${productId}"]`);

        item.quantity--;
        
        if (item.quantity <= 0) {
            // Apply slide-out animation class (CSS needs a .slide-out class for this)
            if(itemElement) itemElement.classList.add('slide-out');
            
            // Remove item from the cart array and re-render the UI after the animation completes (300ms)
            setTimeout(() => {
                cart = cart.filter(product => product.id !== productId);
                updateCartUI();
            }, 300); 
            return; // Exit early to avoid immediate updateCartUI() call
        }
        
        updateCartUI();
    }
}

// --- Notification Logic ---
let messageTimeout;

const showMessage = (quantity, imageUrl, type) => {
    if (!DOM.notificationArea) return;

    clearTimeout(messageTimeout);
    
    // 🚨 IMPROVEMENT: Clear previous notifications with fade out instead of immediate removal
    Array.from(DOM.notificationArea.children).forEach(child => {
        child.style.opacity = '0';
        child.style.transform = 'translateX(100%)';
        setTimeout(() => child.remove(), 500);
    });

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('notification-message', type);

    if (type === 'error') {
        messageDiv.innerHTML = `
            <div>
                <p>&#10007;</p>
                <p>The maximum order quantity is 5 items.</p>
            </div>
        `;
    } else { // type === 'success'
        messageDiv.innerHTML = `
            ${imageUrl ? `<img src="${imageUrl}" alt="Product image">` : ''}
            <div>
                <p>&#10003;</p>
                <p>${quantity} added to cart!</p>
            </div>
        `;
    }

    DOM.notificationArea.prepend(messageDiv); // Prepend to show new message at the top

    // Hide and remove after 3 seconds
    messageTimeout = setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => messageDiv.remove(), 500);
    }, 3000); // Increased duration to 3s for better visibility
};

// --- UI Toggle Utilities (Centralized) ---

// ------------------------------------------
// 🎯 UPDATE 1: Icon swapping logic added
// ------------------------------------------
/** Manages the state of the mobile menu */
function toggleMobileMenu(show) {
    if (DOM.mobileMenu) {
        // Toggle the active class
        const isActive = show !== undefined ? show : DOM.mobileMenu.classList.toggle('mobile-menu-active');
        DOM.mobileMenu.classList.toggle('mobile-menu-active', isActive);
        document.body.style.overflowY = isActive ? 'hidden' : 'auto';

        // 🆕 ICON SWAPPING LOGIC: Hamburger <-> Cross
        if (DOM.hamburgerIcon) {
            if (isActive) {
                // Menu is OPEN, change to cross icon
                DOM.hamburgerIcon.classList.remove('fa-bars');
                DOM.hamburgerIcon.classList.add('fa-xmark');
            } else {
                // Menu is CLOSED, change back to hamburger icon
                DOM.hamburgerIcon.classList.remove('fa-xmark');
                DOM.hamburgerIcon.classList.add('fa-bars');
            }
        }

        // 🎯 FIX: Close the Account Sidebar if the Mobile Menu is being opened
        if (isActive) {
            toggleAccountSidebar(false);
            if(DOM.cartTab) DOM.cartTab.classList.remove('cart-tab-active');
        }
    }
}

/** Manages the state of the account sidebar */
function toggleAccountSidebar(show) {
    if (!DOM.sidebar) return; // Safety check

    const isActive = show !== undefined ? show : DOM.sidebar.classList.toggle('active');
    DOM.sidebar.classList.toggle('active', isActive);
    document.body.style.overflowY = isActive ? 'hidden' : 'auto';
    
    // 🎯 FIX: Close Mobile Menu if Account Sidebar is being opened
    if (isActive) {
        toggleMobileMenu(false); // This will also reset the hamburger icon
        if(DOM.cartTab) DOM.cartTab.classList.remove('cart-tab-active'); // Close cart when sidebar opens
    }
}

/** Manages the state of a modal form */
function toggleForm(formElement, show) {
    if (formElement) {
        formElement.classList.toggle('active', show);
        document.body.style.overflowY = show ? 'hidden' : 'auto';
    }
}

// ------------------------------------------
// 🎯 UPDATE 2: Event Listeners adjusted
// ------------------------------------------
// Sets up all event listeners using event delegation where appropriate
function setupEventListeners() {
    
    // --- Menu & Sidebar Toggles ---
    // The hamburger button now handles both opening and closing/icon swapping
    if (DOM.hamburgerBtn) DOM.hamburgerBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        toggleMobileMenu(); // Toggles the mobile menu and swaps the icon
    });
    
    // ❌ REMOVED: Listener for DOM.closeMobileMenuBtn is no longer needed
    // if (DOM.closeMobileMenuBtn) DOM.closeMobileMenuBtn.addEventListener('click', (e) => { 
    //     e.preventDefault(); 
    //     toggleMobileMenu(false); // Explicitly closes the mobile menu
    // });
    
    if (DOM.accountBtn) DOM.accountBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        toggleAccountSidebar(true); // Opens the account sidebar
    });
    
    if (DOM.closeSidebarBtn) DOM.closeSidebarBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        toggleAccountSidebar(false); // Closes the account sidebar
    });

    // Close mobile menu when a link inside it is clicked
    if (DOM.mobileMenu) {
        DOM.mobileMenu.querySelectorAll('a').forEach(link => {
            // Exclude form buttons to prevent unwanted behavior
            if (!link.classList.contains('mobile-menu-close') && !link.classList.contains('btn')) {
                link.addEventListener('click', () => {
                    // Reuses the central toggle function to close, resetting the icon
                    toggleMobileMenu(false); 
                });
            }
        });
    }

    // --- Cart Tab Toggles ---
    if (DOM.cartIcon && DOM.cartTab) {
        DOM.cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.cartTab.classList.toggle('cart-tab-active');
            toggleAccountSidebar(false); // Close account sidebar if cart opens
            toggleMobileMenu(false); // Close mobile menu if cart opens (resets icon)
        });
    }
    if (DOM.closeCartBtn && DOM.cartTab) {
        DOM.closeCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.cartTab.classList.remove('cart-tab-active');
        });
    }

    // --- Form/Modal Logic ---
    document.querySelectorAll('.sign-in-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForm(DOM.signinForm, true);
            toggleForm(DOM.registerForm, false);
            toggleMobileMenu(false); // Close mobile menu (resets icon)
            toggleAccountSidebar(false); // Close account sidebar
        });
    });

    if (DOM.registerLink && DOM.signinForm && DOM.registerForm) {
        // Use document.querySelectorAll for .register-link as it appears inside the sign-in form too
        document.querySelectorAll('.register-link').forEach(link => { 
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Check if the link text is for "Register here" (within Sign In form)
                if (link.textContent.includes("Register")) { 
                    toggleForm(DOM.signinForm, false);
                    toggleForm(DOM.registerForm, true);
                } else { // Link text is for "Sign In here." (within Register form)
                    toggleForm(DOM.signinForm, true);
                    toggleForm(DOM.registerForm, false);
                }
            });
        });
    }

    if (DOM.closeFormBtns) {
        DOM.closeFormBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleForm(DOM.signinForm, false);
                toggleForm(DOM.registerForm, false);
            });
        });
    }

    // Event delegation for product cards (Add to Cart)
    if (DOM.cardList) {
        DOM.cardList.addEventListener('click', (e) => {
            const cardBtn = e.target.closest('.card-btn');
            if (cardBtn) {
                e.preventDefault();
                const card = e.target.closest('.order-card');
                const productId = parseInt(card.dataset.id);
                addToCart(productId);
            }
        });
    }

    // Event delegation for cart quantity buttons
    if (DOM.cartList) {
        DOM.cartList.addEventListener('click', (e) => {
            const minusBtn = e.target.closest('.minus');
            const plusBtn = e.target.closest('.plus');
            const item = e.target.closest('.item');

            if (item) {
                const productId = parseInt(item.dataset.id);
                if (minusBtn) {
                    e.preventDefault();
                    changeQuantity(productId, 'minus');
                } else if (plusBtn) {
                    e.preventDefault();
                    changeQuantity(productId, 'plus');
                }
            }
        });
    }
}

// The main function to run the application
function initApp() {
    initSwiper();
    fetchProducts();
    setupEventListeners();
    updateCartUI(); // Ensure cart state is rendered on load
}

// Start the application after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);