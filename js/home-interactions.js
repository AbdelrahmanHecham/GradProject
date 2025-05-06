// js/home-interactions.js
// Redirect to Recommendations page when Hardware Recommendations card is clicked
// Redirect to Troubleshooting page when Troubleshooting card is clicked
// Redirect to Learning Center page when Learning Center card is clicked

document.addEventListener('DOMContentLoaded', function() {
  var hwCard = document.getElementById('hardware-recommendations-card');
  if (hwCard) {
    hwCard.style.cursor = 'pointer';
    hwCard.addEventListener('click', function() {
      window.location.href = 'recommendations.html';
    });
  }
  var troubleshootingCard = document.getElementById('troubleshooting-card');
  if (troubleshootingCard) {
    troubleshootingCard.style.cursor = 'pointer';
    troubleshootingCard.addEventListener('click', function() {
      window.location.href = 'troubleshooting.html';
    });
  }
  var learningCenterCard = document.getElementById('learning-center-card');
  if (learningCenterCard) {
    learningCenterCard.style.cursor = 'pointer';
    learningCenterCard.addEventListener('click', function() {
      window.location.href = 'learn.html';
    });
  }
});
