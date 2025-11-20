<?php
if (isset($_GET['lat'], $_GET['lon'])) {
  header("Content-Type: application/json; charset=utf-8");

  // --- latitude e longitude corrigidas (vírgula -> ponto)
  $lat = floatval(str_replace(',', '.', $_GET['lat']));
  $lon = floatval(str_replace(',', '.', $_GET['lon']));

  // --- timezone
  $tz  = date_default_timezone_get();
  date_default_timezone_set($tz);

  // --- pôr-do-sol do dia atual
  $ts     = strtotime("today 12:00:00");
  $sun    = date_sun_info($ts, $lat, $lon);
  $sunset = (isset($sun["sunset"]) && is_int($sun["sunset"])) ? date("H:i", $sun["sunset"]) : "";

  // --- dia da semana em hebraico transliterado
  $diasTrans = [
    "Yom Rishon",
    "Yom Sheni",
    "Yom Shlishi",
    "Yom Revi'i",
    "Yom Chamishi",
    "Yom Shishi",
    "Yom Shabbat"
  ];
  $dia = $diasTrans[date("w", $ts)];

  // --- API Hebcal
  $url = "https://www.hebcal.com/hebcal?cfg=json"
    . "&latitude={$lat}&longitude={$lon}&tzid=" . urlencode($tz)
    . "&start=" . date("Y-m-d")
    . "&end=" . date("Y-m-d", strtotime("+14 days"))
    . "&s=on&leyning=on";

  // --- mapa tradução livros
  $mapa = [
    "Genesis" => "Génesis",
    "Exodus" => "Êxodo",
    "Leviticus" => "Levítico",
    "Numbers" => "Números",
    "Deuteronomy" => "Deuteronómio",
    "Isaiah" => "Isaías",
    "Jeremiah" => "Jeremias",
    "Ezekiel" => "Ezequiel",
    "Hosea" => "Oseias",
    "Joel" => "Joel",
    "Amos" => "Amós",
    "Obadiah" => "Obadias",
    "Jonah" => "Jonas",
    "Micah" => "Miqueias",
    "Nahum" => "Naum",
    "Habakkuk" => "Habacuque",
    "Zephaniah" => "Sofonias",
    "Haggai" => "Ageu",
    "Zechariah" => "Zacarias",
    "Malachi" => "Malaquias",
    "Samuel" => "Samuel",
    "Kings" => "Reis",
    "Chronicles" => "Crónicas"
  ];

  // --- Parashá, Leitura, Haftará
  $parasha = "";
  $leitura = "";
  $haftara = "";

  $json = @file_get_contents($url);

  if ($json !== false) {
    $dados = json_decode($json, true);

    foreach ($dados["items"] as $item) {
      if (($item["category"] ?? "") === "parashat") {

        $parasha = $item["title"] ?? "";
        $leitura = $item["leyning"]["torah"] ?? "";

        $h = $item["leyning"]["haftarah"] ?? "";
        if ($h !== "") {
          $partes = explode(" ", $h, 2);
          $livroEN = $partes[0];
          $ref     = $partes[1] ?? "";
          $livroPT = $mapa[$livroEN] ?? $livroEN;
          $haftara = $livroPT . " " . $ref;
        }

        break;
      }
    }
  }

  // ======================================================
  // --- LOCALIZAÇÃO REAL (CORRIGIDO, 100% FUNCIONAL)
  // ======================================================
  $cidade = "-";
  $pais   = "-";

  $urlGeo = "https://nominatim.openstreetmap.org/reverse?lat={$lat}&lon={$lon}&format=json&addressdetails=1&accept-language=pt-PT";

  $ch = curl_init($urlGeo);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "User-Agent: Mozilla/5.0 (InfoJudaica)",
    "Accept-Language: pt-PT"
  ]);
  $geo = curl_exec($ch);
  curl_close($ch);

  if ($geo !== false) {
    $g = json_decode($geo, true);

    // ordem de prioridade correta
    $cidade = $g['address']['town']
      ?? $g['address']['city']
      ?? $g['address']['village']
      ?? $g['address']['municipality']
      ?? $g['address']['city_district']
      ?? "-";

    $pais = $g['address']['country'] ?? "-";
  }

  // --- devolve tudo como JSON
  echo json_encode([
    "sunset"  => $sunset,
    "dia"     => $dia,
    "parasha" => $parasha,
    "leitura" => $leitura,
    "haftara" => $haftara,
    "cidade"  => $cidade,
    "pais"    => $pais
  ]);

  exit;
}


?>


<!DOCTYPE html>
<html lang="pt-PT">

<head>
  <meta charset="UTF-8">
  <title>Info Judaica</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --bg: #f5f6fa;
      --card: #ffffff;
      --text: #1b1b1b;
      --label: #6f7782;
      --radius: 18px;
      --shadow: 0 8px 22px rgba(0, 0, 0, 0.07);
      --font: "Inter", "Poppins", sans-serif;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: var(--bg);
      font-family: var(--font);
      min-height: 100dvh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 32px;
    }

    .wrapper {
      width: 100%;
      max-width: 1300px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .card {
      overflow: hidden;
      background: var(--card);
      padding: 28px;
      border-radius: 18px;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.07);
      text-align: center;
      transition: 0.2s ease;
    }

    .card:hover {
      transform: translateY(-3px);
    }

    .icon {
      font-size: 32px;
      margin-bottom: 10px;
      opacity: 0.85;
    }

    .label {
      font-size: 13px;
      color: var(--label);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 8px;
    }

    .value {
      font-size: 28px;
      font-weight: 600;
      opacity: 0;
      transform: translateY(5px);
      transition: 0.4s ease;
    }

    .value.show {
      opacity: 1;
      transform: translateY(0);
    }

    @media (max-width: 500px) {
      .wrapper {
        grid-template-columns: 1fr;
      }

      .value {
        font-size: 24px;
      }
    }
  </style>
</head>

<body>

  <div class="wrapper">

    <div class="card">
      <div class="icon">📍</div>
      <span class="label">Localização</span>
      <div id="local" class="value"></div>
    </div>


    <div class="card">
      <div class="icon">📅</div>
      <span class="label">Dia</span>
      <div id="dia" class="value"></div>
    </div>

    <div class="card">
      <div class="icon">🌅</div>
      <span class="label">Shekiá</span>
      <div id="hora" class="value"></div>
    </div>

    <div class="card">
      <div class="icon">📜</div>
      <span class="label">Parashá</span>
      <div id="parashat" class="value"></div>
    </div>

    <div class="card">
      <div class="icon">📖</div>
      <span class="label">Leitura</span>
      <div id="leitura" class="value"></div>
    </div>

    <div class="card">
      <div class="icon">🕎</div>
      <span class="label">Haftará</span>
      <div id="haftara" class="value"></div>
    </div>

  </div>

  <script>
    async function obter() {
      // reset UI
      document.getElementById("local").textContent = "A obter...";

      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seg
            maximumAge: 0
          })
        );
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        console.log("Coords:", lat, lon);
        const r = await fetch(`?lat=${lat.toString().replace(",", ".")}&lon=${lon.toString().replace(",", ".")}`);

        const d = await r.json();
        console.log("Dados:", d);

        document.getElementById("local").textContent =
          d.cidade && d.pais ? `${d.cidade}, ${d.pais}` : "Localização não disponível";

        document.getElementById("dia").textContent = d.dia || "-";
        document.getElementById("hora").textContent = d.sunset || "-";
        document.getElementById("parashat").textContent = d.parasha || "-";
        document.getElementById("leitura").textContent = d.leitura || "-";
        document.getElementById("haftara").textContent = d.haftara || "-";

        document.querySelectorAll(".value").forEach(v => v.classList.add("show"));

      } catch (e) {
        console.error("Erro geolocalização ou fetch:", e);
        document.getElementById("local").textContent = "Permissão negada ou erro";
      }
    }
    obter();
  </script>

</body>

</html>
