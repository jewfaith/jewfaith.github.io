function calculateSunsetForDate(dateStr, lat, lon) {
    try {
        // Converte DD-MM-YYYY para YYYY-MM-DD para criar o objeto Date
        const [d, m, y] = dateStr.split('-');
        const isoDateStr = `${y}-${m}-${d}`;  // Formato ISO para compatibilidade com Date
        const date = new Date(isoDateStr);

        // Obtém os horários do sol usando a biblioteca SunCalc
        const times = SunCalc.getTimes(date, lat, lon);
        const sunset = times.sunset;

        if (sunset) {
            // Formata a hora do pôr do sol no formato HH:MM (24h)
            const sunsetTime = sunset.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false, // Garante o formato de 24h
            });

            // Verifica se o pôr do sol já passou para ajustar a data judaica
            const now = new Date();
            if (now > sunset) {
                // Se o pôr do sol já passou, ajusta para o próximo dia hebraico
                date.setDate(date.getDate() + 1);
            }

            // Formata a data no formato DD.MM.YYYY
            const datePT = formatDatePT(isoDateStr);

            // Retorna a hora e a data separadas: "hora - data"
            return `${sunsetTime} - ${datePT}`;
        }
    } catch (e) {
        console.error("Erro ao calcular pôr do sol:", e);
    }
    return "-";
}
