# Ülevaatuse broneerimissüsteem

Rakendus on loodud **Tallinna Ülikooli** aine "Tarkvara arenduse praktika" raames.

Live server: https://tarkvara-projekt.onrender.com

## Projekti autorid

- **Argo Luur**
- **Gert Matthias Eljas**
- **Tanel Metshein**

## Eesmärk

See rakendus on loodud sõiduki ülevaatuse broneerimise ja töötajate graafikute haldamise lihtsustamiseks. Süsteem võimaldab klientidel valida sobiva teenuse, asukoha ja aja, arvestades töötajate töögraafikuid ja nende kvalifikatsioone (juhiloa kategooriad). Tööandjad saavad hallata töötajate vahetusi ja broneeringuid, töötajad näevad oma graafikuid ning kõik toimub läbi ühtse veebiliidese.

## Broneerimissüsteemi leht

<img width="1339" height="897" alt="image" src="https://github.com/user-attachments/assets/1c345c9a-80cd-4921-932a-6e7f184efb4b" />

>Juhend asub kaustas Tarkvara-Projekt/Website/README.md

## Numbrimärgituvastus

<img width="490" height="366" alt="image" src="https://github.com/user-attachments/assets/c8dd7f02-edbf-4d78-b3f6-f76c87f29f65" />


>Juhend asub kaustas Tarkvara-Projekt/PythonCamera/README.md




## Tehnoloogiad

- Python
- OpenCV
- fast_alpr
- mss
- numpy

## Eeldused

Enne käivitamist veendu, et süsteemis on olemas:

- Python 3.9 või uuem
- Pip

## Paigaldus

1. Ava terminal projekti juurkaustas.
2. Loo virtuaalkeskkond:

```powershell
python -m venv .venv
```

3. Aktiveeri virtuaalkeskkond (Windows PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

4. Paigalda vajalikud paketid:

```powershell
pip install opencv-python fast-alpr mss numpy
```

## Kasutamine

Oluline: käivita skriptid kaustast `PythonCamera`, et suhtelised teed töötaksid (näiteks `AnnotatedImages/` ja `TestImages/`).

```powershell
cd PythonCamera
```

### 1) Pildi töötlemine

Skript: `detFromImage.py`

```powershell
python detFromImage.py
```

Vaikimisi loeb skript faili `TestImages/image2.jpg`, joonistab tuvastused ja salvestab tulemuse faili:

- `AnnotatedImages/annotated_image.jpg`

Lisaks kuvatakse terminalis iga leitud numbri kohta:

- numbrimärgi tekst
- OCR kindlus
- tuvastuse kindlus
- bounding box

### 2) Video või veebikaamera töötlemine

Skript: `detFromVideo.py`

Failis on järgmised variandid:

- Veebikaamera: `process_video(0)`
- Videofail: `process_video("carvideo.mp4")`
- Monitori salvestus: `process_monitor(2, duration_seconds=25)`

Käivita:

```powershell
python detFromVideo.py
```

Vaikimisi on aktiivne monitori salvestus (`process_monitor`).

## Väljund

Skript `detFromVideo.py` kogub unikaalsed numbrimärgid ja salvestab need faili:

- `carlist.json`

JSON-objekti väljad:

- `plate`: tuvastatud numbrimärgi tekst
- `ocr_confidence`: OCR mudeli kindlus
- `det_confidence`: detektori kindlus

Näide:

```json
[
  {
    "plate": "WV54LUT",
    "ocr_confidence": 0.99,
    "det_confidence": 0.84
  }
]
```

## Olulised seadistused

Failides `detFromImage.py` ja `detFromVideo.py` kasutatakse:

- Detektorimudel: `yolo-v9-t-384-license-plate-end2end`
- OCR mudel: `cct-xs-v1-global-model`

Kindluse läved:

- Logimiseks kasutatakse üldjuhul läve `0.6`.
- JSON-i lisamiseks monitori reziimis kasutatakse rangemat tingimust:
  - `ocr_confidence > 0.98`
  - `det_confidence > 0.82`

Vajadusel saad neid väärtusi koodis muuta.

## Levinud probleemid

- `ModuleNotFoundError`: paigalda sõltuvused uuesti ja kontrolli, et virtuaalkeskkond on aktiivne.
- Pildi laadimine ebaõnnestub: kontrolli faili asukohta (`TestImages/image2.jpg`).
- Tulemusi ei salvestata õigesse kohta: veendu, et käivitad skripti kaustast `PythonCamera`.
- Monitori salvestus ei tööta: proovi muuta monitori indeksit, näiteks `process_monitor(1, duration_seconds=25)`.

-Kui video faili ei leia siis vaata kas oled PythonCamera kaustas, mitte tema parent kaustas.


## Litsents

Projektis on fail `LICENSE`.
