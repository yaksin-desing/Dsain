const buttons = document.querySelectorAll('.magnetic-button');

buttons.forEach(button => {
    const text = button.querySelector('.magnetic-text');
    const strength = parseFloat(button.dataset.strength) || 0.2;
    const textStrength = parseFloat(button.dataset.textStrength) || 0.4;

    button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        button.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        text.style.transform = `translate(${x * textStrength}px, ${y * textStrength}px)`;
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = `translate(0px, 0px)`;
        text.style.transform = `translate(0px, 0px)`;
    });
});