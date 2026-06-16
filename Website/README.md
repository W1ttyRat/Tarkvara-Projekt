# Tarkvara-Projekt — Website

> Professional web application for booking vehicle inspections and managing staff schedules.

![Application screenshot](public/images/ui/image.jpg)

## Eesmärk ja lühikirjeldus

See rakendus on loodud sõiduki ülevaatuse broneerimise ja töötajate graafikute haldamise lihtsustamiseks. Süsteem võimaldab klientidel valida sobiva teenuse, asukoha ja aja, arvestades töötajate töögraafikuid ja nende kvalifikatsioone (juhiloa kategooriad). Tööandjad saavad hallata töötajate vahetusi ja broneeringuid, töötajad näevad oma graafikuid ning kõik toimub läbi ühtse veebiliidese. Rakendus on loodud **Tallinna Tehnikaülikooli** aine "Tarkvara arenduse praktika" raames.

## Projekti autorid

- **Argo Luur**
- **Gert Matthias Eljas**
- **Tanel Metshein**

## Kasutatud tehnoloogiad ja versioonid

| Tehnoloogia         | Versioon        |
|---------------------|-----------------|
| Node.js             | 18+ (soovituslik) |
| Express             | ^5.2.1          |
| EJS                 | ^5.0.1          |
| express-ejs-layouts | ^2.5.1          |
| PostgreSQL          | — (andmebaas)   |
| pg (PostgreSQL driver) | ^8.21.0      |
| bcryptjs            | ^3.0.3          |
| jsonwebtoken        | ^9.0.3          |
| helmet              | ^8.1.0          |
| csurf               | ^1.11.0         |
| dotenv              | ^17.4.2         |
| morgan              | ^1.10.1         |
| express-rate-limit  | ^8.5.2          |
| resend (e-post)     | ^6.12.4         |
| cookie-parser       | ^1.4.7          |
| nodemon (arendus)   | ^3.1.14         |

Täieliku loetelu leiab `package.json` failist.

## Paigaldusjuhised ja arenduskeskkonna ülesseadmine

### Eeltingimused

- **Node.js** (versioon 18 või uuem)
- **PostgreSQL** andmebaas (lokaalne või pilves)
- **npm** (kaasas Node.js-ga)
- **Git** versioonihalduseks

### Samm-sammuline paigaldus

#### 1. Repositooriumi kloonimine

```bash
git clone <repositooriumi-url>
cd Tarkvara-Projekt/Website
```

#### 2. Sõltuvuste paigaldamine

```bash
npm install
```

#### 3. Keskkonnamuutujate seadistamine

Loo projekti kausta (`Website/`) fail nimega `.env` järgmiste väärtustega:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sinu_andmebaas
DB_USER=sinu_kasutaja
DB_PASSWORD=sinu_parool
JWT_SECRET=sinu_salajane_voti
RESEND_API_KEY=sinu_resend_voti
NODE_ENV=development
PORT=3000
```

> **Märkus:** `JWT_SECRET` peab olema vähemalt 32 tähemärki pikk juhuslik string. `RESEND_API_KEY` on vajalik e-kirjade saatmiseks (Resend teenuse kaudu).

#### 4. Andmebaasi loomine

Loo PostgreSQL-is uus andmebaas:

```sql
CREATE DATABASE sinu_andmebaas;
```

Seejärel käivita andmebaasi skeemi fail. Skript asub `database/schemas/db.sql`. Käivitamiseks kasuta:

```bash
psql -U sinu_kasutaja -d sinu_andmebaas -f database/schemas/db.sql
```

Skeem loob järgmised tabelid:

- `users` — kasutajad (töötajad ja juhid)
- `client` — kliendid
- `worker` — töötajad
- `licence_category` — juhiloa kategooriad (nt B, C, CE)
- `vehicle` — sõidukid
- `location` — asukohad (ülevaatuspunktid koos uste mõõtudega)
- `service` — teenused (nt ülevaatus, lisatööd)
- `reservation` — broneeringud
- `worker_shift` — töötajate vahetused
- `worker_licence_category` — töötajate kvalifikatsioonid
- `refresh_tokens` — JWT refresh tokenid
- `unavailable_time` — töötajate mitte-kättesaadavad ajad

#### 5. Rakenduse käivitamine

Arendusrežiimis:

```bash
npm run dev
```

Tootmisrežiimis:

```bash
npm start
```

Rakendus on nüüd kättesaadav aadressil: **http://localhost:3000**

### Levinud probleemid ja lahendused

| Probleem | Lahendus |
|----------|----------|
| `JWT_SECRET is required` | Lisa `.env` faili `JWT_SECRET` väärtus |
| `ECONNREFUSED` andmebaasiga | Kontrolli, et PostgreSQL on käivitatud ja `.env` andmed on õiged |
| Port juba kasutuses | Muuda `PORT` väärtust `.env` failis või tapa protsess, mis porti kasutab |

## Litsents

See projekt on litsentseeritud **GNU General Public License v3.0** tingimustel. Lisateavet leiad repositooriumi juures olevast `LICENSE` failist.

---

*Projekt loodud Tallinna Tehnikaülikooli aine "Tarkvara arenduse praktika" raames.*


