/**
 * Optimized World Clock - Performance-First Implementation
 * 
 * Key Optimizations:
 * 1. Lazy rendering with IntersectionObserver (only render visible cards)
 * 2. performance.now() for accurate time without API calls
 * 3. Only update visible clocks every second
 * 4. Batched rendering using requestAnimationFrame
 * 5. Query params instead of hash for SEO
 */

// Time tracking using performance.now() to prevent drift
let startTime = Date.now();
let perfStart = performance.now();

// Get accurate current time without API
function getAccurateTime() {
    return startTime + (performance.now() - perfStart);
}

// Reset time tracking (handles sleep/wake cycles)
function resetTimeTracking() {
    const now = Date.now();
    const drift = now - getAccurateTime();
    if (Math.abs(drift) > 1000) {
        startTime = now;
        perfStart = performance.now();
    }
}

// Cities data - loaded from JSON
let cities = [];
let filteredCities = [];
let renderedCount = 0;
let is24Hour = false;

// IntersectionObserver for lazy loading and visibility tracking
const visibleCards = new Set();
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const card = entry.target;
        if (entry.isIntersecting) {
            visibleCards.add(card);
            // Render card if not already rendered
            if (!card.dataset.rendered) {
                renderCard(card);
            }
        } else {
            visibleCards.delete(card);
        }
    });
}, { rootMargin: '50px' });

// Initial render batch size
const INITIAL_BATCH = 30;
const BATCH_SIZE = 25;

// Load cities data
async function loadCities() {
    try {
        const response = await fetch('cities.json');
        cities = await response.json();
        filteredCities = [...cities];
        init();
    } catch (e) {
        console.error('Failed to load cities:', e);
        document.getElementById('container').innerHTML = '<div class="no-results">Failed to load cities data.</div>';
    }
}

// Format time for a city
function formatTime(city) {
    const now = new Date(getAccurateTime());
    const opts = {
        timeZone: city.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24Hour
    };
    return now.toLocaleTimeString('en-US', opts);
}

// Format date for a city
function formatDate(city) {
    const now = new Date(getAccurateTime());
    const opts = {
        timeZone: city.timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    };
    return now.toLocaleDateString('en-US', opts);
}

// Create card HTML (skeleton first, then render)
function createCardHTML(city, isSkeleton = false) {
    if (isSkeleton) {
        return `
            <div class="card skeleton" data-city="${city.name.toLowerCase()}" data-timezone="${city.timezone}">
                <div class="flag">${city.flag}</div>
                <div class="city">${city.name}</div>
                <div class="time skeleton" style="width:60%;margin:8px auto;height:2.5rem"></div>
                <div class="date skeleton" style="width:80%;margin:8px auto;height:1rem"></div>
                <div class="tz">${city.country}</div>
            </div>
        `;
    }
    const time = formatTime(city);
    const date = formatDate(city);
    return `
        <div class="card" data-city="${city.name.toLowerCase()}" data-timezone="${city.timezone}" data-rendered="true">
            <div class="flag">${city.flag}</div>
            <div class="city">${city.name}</div>
            <div class="time">${time}</div>
            <div class="date">${date}</div>
            <div class="tz">${city.country} • ${city.timezone.split('/').pop()}</div>
        </div>
    `;
}

// Render a single card
function renderCard(cardElement) {
    if (cardElement.dataset.rendered === 'true') {
        // Already rendered, just update time
        const cityName = cardElement.dataset.city;
        const timezone = cardElement.dataset.timezone;
        const city = cities.find(c => 
            c.name.toLowerCase() === cityName && c.timezone === timezone
        );
        if (city) {
            const timeEl = cardElement.querySelector('.time');
            const dateEl = cardElement.querySelector('.date');
            if (timeEl) timeEl.textContent = formatTime(city);
            if (dateEl) dateEl.textContent = formatDate(city);
        }
        return;
    }
    
    // First render - replace skeleton content
    const cityName = cardElement.dataset.city;
    const timezone = cardElement.dataset.timezone;
    const city = cities.find(c => 
        c.name.toLowerCase() === cityName && c.timezone === timezone
    );
    if (city) {
        const time = formatTime(city);
        const date = formatDate(city);
        const timeEl = cardElement.querySelector('.time');
        const dateEl = cardElement.querySelector('.date');
        if (timeEl) {
            timeEl.textContent = time;
            timeEl.classList.remove('skeleton');
            timeEl.style.width = '';
            timeEl.style.height = '';
            timeEl.style.margin = '';
        }
        if (dateEl) {
            dateEl.textContent = date;
            dateEl.classList.remove('skeleton');
            dateEl.style.width = '';
            dateEl.style.height = '';
            dateEl.style.margin = '';
        }
        cardElement.classList.remove('skeleton');
        cardElement.dataset.rendered = 'true';
    }
}

// Render cards in batches using requestAnimationFrame
function renderCardsBatch(startIndex, endIndex, isInitial = false) {
    const container = document.getElementById('container');
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex && i < filteredCities.length; i++) {
        const city = filteredCities[i];
        const cardHTML = createCardHTML(city, true);
        const temp = document.createElement('div');
        temp.innerHTML = cardHTML;
        const card = temp.firstElementChild;
        fragment.appendChild(card);
    }
    
    container.appendChild(fragment);
    
    // Observe all new cards
    const newCards = container.querySelectorAll('.card:not([data-observed])');
    newCards.forEach(card => {
        observer.observe(card);
        card.dataset.observed = 'true';
    });
    
    // Render visible cards immediately
    if (isInitial) {
        // On initial load, render first batch immediately
        requestAnimationFrame(() => {
            newCards.forEach(card => {
                renderCard(card);
            });
        });
    } else {
        // For subsequent batches, check visibility
        requestAnimationFrame(() => {
            newCards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight + 200 && rect.bottom > -200;
                if (isVisible) {
                    renderCard(card);
                }
            });
        });
    }
    
    renderedCount = Math.min(endIndex, filteredCities.length);
    
    // Continue batching if more to render
    if (renderedCount < filteredCities.length) {
        requestAnimationFrame(() => {
            renderCardsBatch(renderedCount, renderedCount + BATCH_SIZE);
        });
    }
}

// Render all cards (with lazy loading)
function renderAllCards() {
    const container = document.getElementById('container');
    container.innerHTML = '';
    renderedCount = 0;
    visibleCards.clear();
    
    if (filteredCities.length === 0) {
        container.innerHTML = '<div class="no-results">No cities found. Try another search!</div>';
        return;
    }
    
    // Render initial batch
    requestAnimationFrame(() => {
        renderCardsBatch(0, INITIAL_BATCH, true);
    });
}

// Update only visible clocks
function updateVisibleClocks() {
    resetTimeTracking(); // Handle sleep/wake cycles
    
    visibleCards.forEach(card => {
        if (card.dataset.rendered === 'true') {
            const cityName = card.dataset.city;
            const timezone = card.dataset.timezone;
            const city = cities.find(c => 
                c.name.toLowerCase() === cityName && c.timezone === timezone
            );
            if (city) {
                const timeEl = card.querySelector('.time');
                const dateEl = card.querySelector('.date');
                if (timeEl) timeEl.textContent = formatTime(city);
                if (dateEl) dateEl.textContent = formatDate(city);
            }
        }
    });
}

// Search functionality
function handleSearch() {
    const searchInput = document.getElementById('search');
    const term = searchInput.value.toLowerCase().trim();
    
    if (term === '') {
        filteredCities = [...cities];
    } else {
        filteredCities = cities.filter(city =>
            city.name.toLowerCase().includes(term) ||
            city.country.toLowerCase().includes(term) ||
            city.timezone.toLowerCase().includes(term)
        );
    }
    
    renderAllCards();
}

// Handle query params for SEO
function handleQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get('city');
    
    if (cityParam) {
        const cityName = decodeURIComponent(cityParam).toLowerCase();
        const city = cities.find(c => 
            c.name.toLowerCase() === cityName ||
            c.name.toLowerCase().replace(/\s+/g, '-') === cityName
        );
        
        if (city) {
            document.title = `${city.name} Time - World Clock`;
            // Update meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.content = `Current time in ${city.name}, ${city.country}. Live clock for ${city.timezone}.`;
            }
            
            // Scroll to city after render
            setTimeout(() => {
                const card = document.querySelector(`[data-city="${city.name.toLowerCase()}"]`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.border = '2px solid #4a9eff';
                    setTimeout(() => {
                        card.style.border = '';
                    }, 3000);
                }
            }, 1000);
        }
    }
}

// Initialize
function init() {
    // Handle search
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', handleSearch);
    
    // Initial render
    renderAllCards();
    
    // Handle query params
    handleQueryParams();
    
    // Update visible clocks every second
    setInterval(updateVisibleClocks, 1000);
    
    // Reset time tracking periodically and on visibility change
    setInterval(resetTimeTracking, 60000); // Every minute
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            resetTimeTracking();
        }
    });
}

// Start loading cities when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCities);
} else {
    loadCities();
}

