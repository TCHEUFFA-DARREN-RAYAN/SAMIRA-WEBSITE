  window.addEventListener('load', function() {
            setTimeout(function() {
                const loadingScreen = document.getElementById('loading-screen');
                const mainContent = document.getElementById('main-content');
                
                // Start fade out
                loadingScreen.classList.add('fade-out');
                
                // Remove loading screen and show content
                setTimeout(function() {
                    document.body.classList.remove('loading');
                    if (loadingScreen.parentNode) {
                        loadingScreen.remove();
                    }
                    mainContent.classList.add('show');
                }, 800);
            }, 2500); // Show for 1.5 seconds - smooth and quick
        });