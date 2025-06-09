
### Prompt‑Loading Implementation Plan (v3)

**Objective**  
Give AI Coding Agents a concise, implementation‑ready blueprint for adding multi‑layer prompt management to **sports‑platform v3** using OpenAI **Responses API**.

---

#### 1 Prompt Layers

| Layer | Scope & Purpose | Storage Location | Sent in `instructions`? | Update Cadence |
|-------|-----------------|------------------|-------------------------|----------------|
| **Global System** | Platform‑wide role, guard‑rails | `/prompts/global.txt` | **Always** | Rare (dev only) |
| **Domain** | Sport‑specific rules, tool hints | `/prompts/{sport}.txt` | When sport active | Per‑sport |
| **User Pref** | Tone, language, fav team, etc. | KV `user:<id>:prefs` | Every request | User editable |
| **Script (Query)** | Reusable macro / task | KV `user:<id>:scripts` | **No** – becomes `input` | User editable |

**Merge order:** Global → Domain → User Pref (highest to lowest priority).  
If conflict, higher layer wins.

---

#### 2 Proxy Request Flow

1. **Parse** `userId`, `sport`, (optional) `scriptId`, `previous_response_id`.  
2. **Build `instructions`:**  
   - `globalPrompt`  
   - `domainPrompt[sport]`  
   - `prefPrompt(userId)`  
3. **Select `input`:**  
   - `scriptText(scriptId)` **or** raw `userQuery`.  
4. **Attach:**  
   - `tools` (filtered to sport)  
   - `previous_response_id` (if any)  
5. **POST** to `/v1/responses` with `{stream:true}`.  
6. **Persist** returned `response.id` → KV `SESSION:<userId>`.

---

#### 3 Key–Value Schema

```
PROMPTS/global.txt
PROMPTS/{sport}.txt
USER_PREFS/user:<id>
SCRIPTS/user:<id>:script:<name>
SESSION/user:<id>              # last response_id
```

---

#### 4 Frontend Endpoints

- `GET /prefs` / `PATCH /prefs` – manage user preferences.  
- `POST /scripts` / `GET /scripts` – CRUD prompt scripts.  
- `POST /query` – chat endpoint payload:  
  ```json
  {
    "userId": "abc",
    "sport": "baseball",
    "query": "...",      // optional if scriptId present
    "scriptId": "dailyUpdate"
  }
  ```

---

#### 5 Action Checklist

- [ ] Write **global** and **domain** prompt files.  
- [ ] Extend KV namespace per schema above.  
- [ ] Add helpers `prefPrompt()`, `scriptText()` in sports‑proxy.  
- [ ] Update `/query` handler to assemble prompts as per §2.  
- [ ] Implement UI pages: **Preferences**, **Scripts**.  
- [ ] Unit‑test prompt assembly; E2E test domain switch + script run.  
- [ ] Monitor production: tool‑call error rate, response latency, user‑satisfaction.

---

#### 6 AI Agent Guard‑Rails

1. **Use tools first** for factual answers.  
2. **Stay on‑topic**: sports only. Politely refuse other requests.  
3. **Ask clarifying questions** when sport/league is ambiguous.  
4. **Respect user prefs** for tone/style, yet remain factual and safe.  
5. **Never override Global layer**; Domain refinements must comply.

---

_End of document —  ~120 lines_
