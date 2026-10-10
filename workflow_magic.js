// Hide HighLevel Advanced Workflow Builder grid lines
(function() {
    var style = document.createElement('style');
    style.textContent = `
        .vue-flow__background,
        svg.vue-flow__background,
        .vue-flow__background-pattern,
        .react-flow__background,
        svg.react-flow__background {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }
    `;
    document.head.appendChild(style);
})();