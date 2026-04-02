/**
 * Google Apps Script - Web App endpoint for Wedding Sheet
 *
 * Setup nhanh:
 * 1) Tao Google Sheet moi, tao 2 sheet: Guestbook, RSVP
 * 2) Extensions -> Apps Script -> dan file nay
 * 3) Deploy -> New deployment -> Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4) Copy URL /exec => dan vao sheet-content.js (webhookUrl)
 */

const TOKEN = ''; // dat giong sheet-content.js neu dung xac thuc

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    let data = {};

    // Ho tro ca 2 kieu gui:
    // 1) JSON thang
    // 2) form-urlencoded: payload=<json>
    if (raw.indexOf('payload=') === 0) {
      const decoded = decodeURIComponent(raw.replace(/^payload=/, '').replace(/\+/g, ' '));
      data = JSON.parse(decoded || '{}');
    } else {
      data = JSON.parse(raw || '{}');
    }

    // fallback lay tu parameter neu co
    if ((!data || !data.type) && e && e.parameter) {
      const p = e.parameter;
      if (p.payload) {
        try {
          data = JSON.parse(p.payload);
        } catch (_) {}
      }
      data = {
        ...data,
        type: data.type || p.type || '',
        name: data.name || p.name || '',
        message: data.message || p.message || '',
        guests: data.guests || p.guests || ''
      };
    }
    if (TOKEN && data.token !== TOKEN) {
      return jsonResponse({ ok: false, error: 'invalid_token' }, 401);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const type = String(data.type || '').toLowerCase();
    const submittedAt = data.submittedAt || new Date().toISOString();

    if (type === 'guestbook') {
      const sh = ss.getSheetByName('Guestbook') || ss.insertSheet('Guestbook');
      if (sh.getLastRow() === 0) {
        sh.appendRow(['submittedAt', 'name', 'message']);
      }
      sh.appendRow([submittedAt, data.name || '', data.message || '']);
      return jsonResponse({ ok: true, type: 'guestbook' }, 200);
    }

    if (type === 'rsvp') {
      const sh = ss.getSheetByName('RSVP') || ss.insertSheet('RSVP');
      if (sh.getLastRow() === 0) {
        sh.appendRow(['submittedAt', 'name', 'guests']);
      }
      sh.appendRow([submittedAt, data.name || '', Number(data.guests || 0)]);
      return jsonResponse({ ok: true, type: 'rsvp' }, 200);
    }

    return jsonResponse({ ok: false, error: 'unknown_type' }, 400);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: 'webapp_alive' }, 200);
}

function jsonResponse(obj, code) {
  return ContentService
    .createTextOutput(JSON.stringify({ ...obj, status: code }))
    .setMimeType(ContentService.MimeType.JSON);
}

