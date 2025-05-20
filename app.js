document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const tabButtons = document.querySelectorAll('.tab-button');
    const sidebarContents = document.querySelectorAll('.sidebar-content');
    const toolButtons = document.querySelectorAll('.tool-button');
    const colorPreview = document.querySelector('.color-preview');
    const pageContent = document.getElementById('page-content');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageEl = document.getElementById('current-page');
    const currentPageBottomEl = document.getElementById('current-page-bottom');
    const totalPagesEl = document.getElementById('total-pages');
    const totalPagesBottomEl = document.getElementById('total-pages-bottom');
    const addPageBtn = document.getElementById('add-page');
    
    // App State
    let currentPage = 1;
    let totalPages = 120;
    let currentTool = 'pen';
    let currentColor = '#000000';
    let isDrawing = false;
    let holdTimer = null;
    let isHoldingPencil = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    
    // Page templates mapping
    const pageTemplates = {
        1: null, // Index page (blank canvas)
        2: null, // Future log (blank canvas)
        3: null, // Monthly log (blank canvas)
        4: 'template-daily-log',
        5: null, // Google Calendar (blank canvas)
        6: 'template-builder-project',
        7: 'template-materials-tracker',
        8: 'template-builder-meeting',
        9: 'template-invoice-tracker',
        10: 'template-sales-tracker',
        11: 'template-countertops',
        12: 'template-staff-meeting'
    };
    
    // Initialize the app
    function init() {
        loadPageContent(currentPage);
        updatePageIndicators();
        
        // Show initial sidebar tab content
        document.getElementById('journal-tab').classList.remove('hidden');
    }
    
    // Sidebar toggle
    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', function() {
            sidebar.classList.add('open');
        });
    }
    
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', function() {
            sidebar.classList.remove('open');
        });
    }
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            sidebarContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        });
    });
    
    // Tool selection
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tool = this.dataset.tool;
            
            // Update active tool button
            toolButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update current tool
            currentTool = tool;
        });
    });
    
    // Page navigation
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadPageContent(currentPage);
                updatePageIndicators();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                loadPageContent(currentPage);
                updatePageIndicators();
            }
        });
    }
    
    // Add page button
    if (addPageBtn) {
        addPageBtn.addEventListener('click', function() {
            totalPages++;
            currentPage = totalPages;
            loadPageContent(currentPage);
            updatePageIndicators();
        });
    }
    
    // Handle page navigation from sidebar
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.dataset.page);
            currentPage = page;
            loadPageContent(currentPage);
            updatePageIndicators();
        });
    });
    
    // Load page content based on page number
    function loadPageContent(pageNumber) {
        // Clear current content
        pageContent.innerHTML = '';
        
        // Check if there's a template for this page
        const templateId = pageTemplates[pageNumber];
        
        if (templateId) {
            // Get template content
            const template = document.getElementById(templateId);
            if (template) {
                const clone = template.content.cloneNode(true);
                pageContent.appendChild(clone);
            }
        }
        
        // Always set up a drawing canvas
        setupDrawingCanvas();
    }
    
    // Update page indicators
    function updatePageIndicators() {
        if (currentPageEl) currentPageEl.textContent = currentPage;
        if (currentPageBottomEl) currentPageBottomEl.textContent = currentPage;
        if (totalPagesEl) totalPagesEl.textContent = totalPages;
        if (totalPagesBottomEl) totalPagesBottomEl.textContent = totalPages;
    }
    
    // Setup drawing canvas
    function setupDrawingCanvas() {
        // Remove existing canvas if any
        const existingCanvas = document.getElementById('drawing-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        // Create new canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'drawing-canvas';
        
        // Set canvas dimensions to match container
        canvas.width = pageContent.offsetWidth;
        canvas.height = pageContent.offsetHeight;
        
        // Append canvas to page content
        pageContent.appendChild(canvas);
        
        // Get canvas context
        const ctx = canvas.getContext('2d');
        
        // Drawing event listeners
        canvas.addEventListener('pointerdown', startDrawing);
        canvas.addEventListener('pointermove', draw);
        canvas.addEventListener('pointerup', stopDrawing);
        canvas.addEventListener('pointerout', stopDrawing);
        
        // Drawing functions
        function startDrawing(e) {
            isDrawing = true;
            const { offsetX, offsetY } = getCoordinates(e);
            startX = offsetX;
            startY = offsetY;
            lastX = offsetX;
            lastY = offsetY;
            
            // Start timer to detect holding
            if (currentTool === 'pen' || currentTool === 'line') {
                holdTimer = setTimeout(() => {
                    isHoldingPencil = true;
                }, 300); // Hold for 300ms to activate straight line mode
            }
        }
        
        function draw(e) {
            if (!isDrawing) return;
            
            const { offsetX, offsetY } = getCoordinates(e);
            
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = currentColor;
            
            if (currentTool === 'pen')if (currentTool === 'pen') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.lineWidth = 2;
                
                if (isHoldingPencil) {
                    // Clear the canvas area to redraw the straight line
                    // This is a simplified approach - in a real app you'd use a separate layer
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw straight line from start point to current point
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(offsetX, offsetY);
                    ctx.stroke();
                } else {
                    // Normal freehand drawing
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(offsetX, offsetY);
                    ctx.stroke();
                }
            } else if (currentTool === 'highlighter') {
                ctx.globalCompositeOperation = 'multiply';
                ctx.lineWidth = 10;
                ctx.globalAlpha = 0.3;
                
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(offsetX, offsetY);
                ctx.stroke();
            } else if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = 20;
                ctx.globalAlpha = 1;
                
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(offsetX, offsetY);
                ctx.stroke();
            } else if (currentTool === 'line') {
                // Always draw straight lines with the line tool
                ctx.globalCompositeOperation = 'source-over';
                ctx.lineWidth = 2;
                
                // Clear the canvas area to redraw the line
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw straight line from start point to current point
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(offsetX, offsetY);
                ctx.stroke();
            }
            
            // Update last position
            if (!isHoldingPencil || currentTool !== 'pen') {
                lastX = offsetX;
                lastY = offsetY;
            }
        }
        
        function stopDrawing() {
            isDrawing = false;
            isHoldingPencil = false;
            clearTimeout(holdTimer);
            ctx.globalAlpha = 1; // Reset alpha for next drawing
        }
        
        function getCoordinates(event) {
            const rect = canvas.getBoundingClientRect();
            return {
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top
            };
        }
    }
    
    // Handle window resize to adjust canvas size
    window.addEventListener('resize', function() {
        const canvas = document.getElementById('drawing-canvas');
        if (canvas) {
            canvas.width = pageContent.offsetWidth;
            canvas.height = pageContent.offsetHeight;
        }
    });
    
    // Add click handling for the add-item elements
    document.addEventListener('click', function(e) {
        if (e.target.closest('.bullet-item.add-item')) {
            const addItem = e.target.closest('.bullet-item.add-item');
            const bulletList = addItem.parentNode;
            
            // Clone the add item
            const newItem = addItem.cloneNode(true);
            newItem.classList.remove('add-item');
            
            // Update the bullet symbol from + to •
            const bulletEl = newItem.querySelector('.bullet');
            if (bulletEl) {
                bulletEl.textContent = '•';
            }
            
            // Clear the content text
            const contentEl = newItem.querySelector('.content');
            if (contentEl) {
                contentEl.textContent = '';
                
                // Insert the new item before the add item
                bulletList.insertBefore(newItem, addItem);
                
                // Focus the content element
                contentEl.focus();
            }
        }
    });
    
    // Initialize app
    init();
});
