document.addEventListener('DOMContentLoaded', () => {
    const fromSelect = document.getElementById('from-currency');
    const toSelect = document.getElementById('to-currency');
    const amountInput = document.getElementById('amount');
    const convertBtn = document.getElementById('convert-btn');
    const swapBtn = document.getElementById('swap-btn');
    const resultDiv = document.getElementById('result');
    const resultAmount = document.getElementById('result-amount');
    const resultCurrency = document.getElementById('result-currency');
    const rateInfo = document.getElementById('rate-info');

    // Fetch currencies on load
    fetch('/currencies')
        .then(response => response.json())
        .then(data => {
            const currencies = data.currencies;
            currencies.forEach(currency => {
                const option1 = new Option(currency, currency);
                const option2 = new Option(currency, currency);
                fromSelect.add(option1);
                toSelect.add(option2);
            });

            // Set defaults
            fromSelect.value = 'USD';
            toSelect.value = 'EUR';
        })
        .catch(error => console.error('Error fetching currencies:', error));

    // Convert function
    const convert = async () => {
        const from = fromSelect.value;
        const to = toSelect.value;
        const amount = amountInput.value;

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            const response = await fetch(`/convert?from_currency=${from}&to_currency=${to}&amount=${amount}`);
            if (!response.ok) throw new Error('Conversion failed');

            const data = await response.json();

            resultAmount.textContent = data.result.toFixed(2);
            resultCurrency.textContent = to;
            rateInfo.textContent = `1 ${from} = ${data.rate} ${to}`;

            resultDiv.classList.remove('hidden');
        } catch (error) {
            console.error('Error converting:', error);
            alert('Failed to convert currency. Please try again.');
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert';
        }
    };

    convertBtn.addEventListener('click', convert);

    // Swap currencies
    swapBtn.addEventListener('click', () => {
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        // Optional: auto convert after swap
        // convert();
    });

    // Enter key support
    amountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') convert();
    });
});
