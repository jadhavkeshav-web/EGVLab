/* EG Virtual Lab – "site has moved" notice
 * Shows a pop-up on the GitHub Pages copy only, linking to the same page
 * on the institute website. Safe to include on the vpkbiet.org copy too:
 * it does nothing there.
 */
(function () {
  var NEW_BASE = 'https://vpkbiet.org/egvlab/';

  // Run only on the GitHub Pages site
  if (location.hostname.indexOf('github.io') === -1) return;

  // Show once per browser session (ignore if storage is blocked)
  try { if (sessionStorage.getItem('egv_moved_seen')) return; } catch (e) {}

  // Same page on the new site (e.g. .../EGVLab/IsometricView_App.html)
  var file = location.pathname.split('/').pop();
  var target = NEW_BASE + (file && file !== 'index.html' ? file : '') +
               location.search + location.hash;

  function show() {
    var css = document.createElement('style');
    css.textContent =
      '#egv-moved{position:fixed;inset:0;z-index:2147483647;display:flex;' +
      'align-items:center;justify-content:center;background:rgba(10,20,35,.6);' +
      'font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;padding:16px}' +
      '#egv-moved .box{background:#fff;color:#16344f;max-width:420px;width:100%;' +
      'border-radius:12px;padding:24px;box-shadow:0 10px 40px rgba(0,0,0,.3);text-align:center}' +
      '#egv-moved h2{margin:0 0 10px;font-size:20px}' +
      '#egv-moved p{margin:0 0 18px;font-size:15px;line-height:1.5;color:#333}' +
      '#egv-moved a.go{display:block;background:#16344f;color:#fff;text-decoration:none;' +
      'padding:12px;border-radius:8px;font-weight:600;font-size:15px}' +
      '#egv-moved a.go:hover{background:#1f4b72}' +
      '#egv-moved button{margin-top:10px;background:none;border:0;color:#555;' +
      'font-size:14px;cursor:pointer;text-decoration:underline}';
    document.head.appendChild(css);

    var o = document.createElement('div');
    o.id = 'egv-moved';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-modal', 'true');
    o.innerHTML =
      '<div class="box">' +
        '<h2>EG Virtual Lab has moved</h2>' +
        '<p>The updated version of EG Virtual Lab is now hosted on the VPKBIET website, ' +
        'with student login and progress tracking. Please use the new link and update your bookmarks.</p>' +
        '<a class="go" href="' + target + '">Go to the updated website</a>' +
        '<button type="button">Continue on this page</button>' +
      '</div>';
    document.body.appendChild(o);

    o.querySelector('button').onclick = function () {
      try { sessionStorage.setItem('egv_moved_seen', '1'); } catch (e) {}
      o.remove();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();
