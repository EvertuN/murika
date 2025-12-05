document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId, this);
        });
    });
});

function showSection(sectionId, element) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('[data-section]').forEach(link => {
        link.classList.remove('active');
    });

    document.querySelectorAll('.navbar-nav > .nav-item > .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    if (element) {
        if (element.classList.contains('dropdown-item')) {
            const toggle = element.closest('.dropdown')?.querySelector('.nav-link');
            if (toggle) toggle.classList.add('active');
            document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
        } else if (!element.classList.contains('btn')) {
            element.classList.add('active');
        }
    }
}
