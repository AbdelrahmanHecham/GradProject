// Redirect to signup/login if not authenticated
(function() {
  // Use localStorage to check for a simple auth flag (e.g. 'isAuthenticated')
  // In a real app, use a secure cookie or token and verify on the server.
  const isAuth = localStorage.getItem('isAuthenticated');
  const onAuthPage = /signup.html|login.html/.test(window.location.pathname);

  if (!isAuth && !onAuthPage) {
    // Not authenticated & not already on auth page, redirect to signup
    window.location.replace('signup.html');
  }
  // Optionally, if authenticated and on auth page, redirect to home
  // else if (isAuth && onAuthPage) {
  //   window.location.replace('index.html');
  // }
})();
