const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  const carousel = document.getElementById('carousel');
  document.getElementById('prevBtn').addEventListener('click', () => carousel.scrollBy({left:-340, behavior:'smooth'}));
  document.getElementById('nextBtn').addEventListener('click', () => carousel.scrollBy({left:340, behavior:'smooth'}));
