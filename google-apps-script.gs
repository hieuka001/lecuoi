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

/** Lay gia tri mot key trong body application/x-www-form-urlencoded (payload co the khong dung dau chuoi). */
function extractUrlEncodedValue_(qs, key) {
  if (!qs) return null;
  var parts = String(qs).split('&');
  for (var i = 0; i < parts.length; i++) {
    var eq = parts[i].indexOf('=');
    if (eq < 0) continue;
    var k = decodeURIComponent(parts[i].substring(0, eq).replace(/\+/g, ' '));
    if (k === key) {
      return decodeURIComponent(parts[i].substring(eq + 1).replace(/\+/g, ' '));
    }
  }
  return null;
}

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var raw = (e && e.postData && e.postData.contents) ? String(e.postData.contents).trim() : '';
    var data = {};

    // 1) Google Apps Script parse san urlencoded -> e.parameter.payload (uu tien)
    // 2) Hoac tach dung gia tri payload=... (khong duoc JSON.parse ca chuoi "payload=...&type=...")
    if (p.payload) {
      try {
        data = JSON.parse(p.payload);
      } catch (err) {
        return jsonResponse({ ok: false, error: 'bad_payload_json' }, 400);
      }
    } else {
      var payloadStr = extractUrlEncodedValue_(raw, 'payload');
      if (payloadStr !== null) {
        try {
          data = JSON.parse(payloadStr || '{}');
        } catch (err) {
          return jsonResponse({ ok: false, error: 'bad_payload_json' }, 400);
        }
      } else if (raw && raw.charAt(0) === '{') {
        try {
          data = JSON.parse(raw);
        } catch (err) {
          return jsonResponse({ ok: false, error: 'bad_json' }, 400);
        }
      }
    }

    data = Object.assign({}, data, {
      type: (data && data.type) || p.type || '',
      name: (data && data.name) || p.name || '',
      message: (data && data.message) || p.message || '',
      guests: (data && data.guests !== undefined && data.guests !== '') ? data.guests : (p.guests || ''),
      token: (data && data.token) || p.token || ''
    });
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

function doGet(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    if (TOKEN && p.token !== TOKEN) {
      return jsonResponse({ ok: false, error: 'invalid_token' }, 401);
    }
    if (p.action === 'guestbook') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sh = ss.getSheetByName('Guestbook');
      if (!sh || sh.getLastRow() < 2) {
        return jsonResponse({ ok: true, entries: [] }, 200);
      }
      var last = sh.getLastRow();
      var vals = sh.getRange(2, 1, last, 3).getValues();
      var entries = [];
      for (var i = 0; i < vals.length; i++) {
        var cellAt = vals[i][0];
        var atStr = '';
        if (Object.prototype.toString.call(cellAt) === '[object Date]') {
          atStr = cellAt.toISOString ? cellAt.toISOString() : String(cellAt);
        } else {
          atStr = String(cellAt || '');
        }
        entries.push({
          submittedAt: atStr,
          name: String(vals[i][1] || ''),
          message: String(vals[i][2] || '')
        });
      }
      return jsonResponse({ ok: true, entries: entries }, 200);
    }
    return jsonResponse({ ok: true, message: 'webapp_alive' }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

function jsonResponse(obj, code) {
  return ContentService
    .createTextOutput(JSON.stringify({ ...obj, status: code }))
    .setMimeType(ContentService.MimeType.JSON);
}

