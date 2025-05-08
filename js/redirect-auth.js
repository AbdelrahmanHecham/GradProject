// Redirect to signup/login if not authenticated, and redirect authenticated users away from login/signup
(function() {
  const isAuth = localStorage.getItem('isAuthenticated');
  const onAuthPage = /signup.html|login.html/.test(window.location.pathname);

  if (!isAuth && !onAuthPage) {
    // Not authenticated & not already on auth page, redirect to signup
    window.location.replace('signup.html');
  } else if (isAuth && onAuthPage) {
    // Authenticated and on auth page, redirect to home
    window.location.replace('index.html');
  }
})();
