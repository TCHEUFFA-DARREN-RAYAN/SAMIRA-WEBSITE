
window.addEventListener('load', function() {
    setTimeout(function() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        
        setTimeout(function() {
            document.body.classList.remove('loading');
            if (loadingScreen.parentNode) {
                loadingScreen.remove();
            }
        }, 800);
    }, 1000); // Show for 1 second minimum
});

