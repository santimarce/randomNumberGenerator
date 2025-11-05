class LCGGenerator {
  constructor(multiplier, increment, modulus, seed) {
    this.multiplier = multiplier;
    this.increment = increment;
    this.modulus = modulus;
    this.seed = seed;
  }

  generate(count) {
    const values = [];
    let current = this.seed;

    for (let i = 0; i < count; i += 1) {
      current = (this.multiplier * current + this.increment) % this.modulus;
      values.push(current);
    }

    return values;
  }

  generateNormalized(count) {
    const rawValues = this.generate(count);
    return rawValues.map((value) => ({
      raw: value,
      normalized: value / this.modulus,
    }));
  }
}

class ScatterPlot {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  clear() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.drawAxes();
  }

  drawAxes() {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(40, canvas.height - 30);
    ctx.lineTo(canvas.width - 20, canvas.height - 30);
    ctx.moveTo(40, canvas.height - 30);
    ctx.lineTo(40, 20);
    ctx.stroke();
    ctx.restore();
  }

  plot(data) {
    this.clear();

    if (!data.length) return;

    const padding = { left: 40, right: 20, top: 20, bottom: 30 };
    const width = this.canvas.width - padding.left - padding.right;
    const height = this.canvas.height - padding.top - padding.bottom;

    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#4a63e7';

    data.forEach(({ normalized }, index) => {
      const x = padding.left + (index / Math.max(data.length - 1, 1)) * width;
      const y = padding.top + (1 - normalized) * height;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.restore();
  }
}

class App {
  constructor() {
    this.form = document.getElementById('lcg-form');
    this.errorMessage = document.getElementById('form-error');
    this.resultsContainer = document.getElementById('results-container');
    this.resetButton = document.getElementById('reset-btn');
    this.canvas = document.getElementById('scatter-canvas');

    this.plot = new ScatterPlot(this.canvas);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleReset = this.handleReset.bind(this);

    this.form.addEventListener('submit', this.handleSubmit);
    this.resetButton.addEventListener('click', this.handleReset);

    this.plot.clear();
  }

  getInputValues() {
    const seed = this.form.seed.value.trim();
    const multiplier = this.form.multiplier.value.trim();
    const increment = this.form.increment.value.trim();
    const modulus = this.form.modulus.value.trim();
    const count = this.form.count.value.trim();

    return { seed, multiplier, increment, modulus, count };
  }

  validateInputs({ seed, multiplier, increment, modulus, count }) {
    const parsed = {
      seed: Number(seed),
      multiplier: Number(multiplier),
      increment: Number(increment),
      modulus: Number(modulus),
      count: Number(count),
    };

    const values = Object.entries(parsed);
    const invalidField = values.find(([, value]) => !Number.isInteger(value));

    if (invalidField) {
      throw new Error('Todos los parámetros deben ser números enteros.');
    }

    if (parsed.modulus <= 1) {
      throw new Error('El módulo debe ser un entero mayor que 1.');
    }

    if (parsed.seed < 0 || parsed.seed >= parsed.modulus) {
      throw new Error('La semilla debe cumplir 0 ≤ semilla < módulo.');
    }

    if (parsed.count <= 0) {
      throw new Error('La cantidad de números debe ser mayor que 0.');
    }

    if (parsed.count > 100) {
      const confirmGeneration = window.confirm(
        'Se generarán más de 100 números. ¿Deseas continuar?'
      );
      if (!confirmGeneration) {
        throw new Error('Generación cancelada por el usuario.');
      }
    }

    return parsed;
  }

  displayResults(data) {
    this.resultsContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();
    data.forEach((value, index) => {
      const item = document.createElement('div');
      item.className = 'result-item';

      const rawSpan = document.createElement('span');
      rawSpan.textContent = `X${index + 1}: ${value.raw}`;

      const valueSpan = document.createElement('span');
      valueSpan.textContent = `u${index + 1}: ${value.normalized.toFixed(5)}`;

      item.appendChild(rawSpan);
      item.appendChild(valueSpan);
      fragment.appendChild(item);
    });

    this.resultsContainer.appendChild(fragment);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.errorMessage.textContent = '';

    try {
      const rawValues = this.getInputValues();
      const { seed, multiplier, increment, modulus, count } = this.validateInputs(rawValues);

      const generator = new LCGGenerator(multiplier, increment, modulus, seed);
      const data = generator.generateNormalized(count);

      this.displayResults(data);
      this.plot.plot(data);
    } catch (error) {
      if (error.message === 'Generación cancelada por el usuario.') {
        return;
      }
      this.errorMessage.textContent = error.message;
      this.resultsContainer.innerHTML = '';
      this.plot.clear();
    }
  }

  handleReset() {
    this.form.reset();
    this.form.seed.value = '1';
    this.form.multiplier.value = '5';
    this.form.increment.value = '3';
    this.form.modulus.value = '16';
    this.form.count.value = '10';
    this.errorMessage.textContent = '';
    this.resultsContainer.innerHTML = '';
    this.plot.clear();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
