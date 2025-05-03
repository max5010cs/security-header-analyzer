function typeEffect(element, html, speed = 30) {
  let i = 0;
  function typing() {
    if (i < html.length) {
      element.innerHTML += html.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }
  typing();
};





async function scanHeaders() {
  const urlInput = document.getElementById('urlInput');
  const resultDiv = document.getElementById('result');
  const loading = document.getElementById('loading');

  const url = urlInput.value.trim();

  if (!url) {
    resultDiv.innerHTML = `<div class="error-message">⚠️ Please enter a URL to scan.</div>`;
    return;
  }

  // Show loading spinner while the process ison
  loading.classList.remove('hidden');
  resultDiv.innerHTML = '';

  try {
    const response = await fetch('http://localhost:3000/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const headers = await response.json();

    // Hide loading spinner, process isofff
    loading.classList.add('hidden');

    if (!response.ok) {
      resultDiv.innerHTML = `<div class="error-message">❌ Error: ${headers.error}</div>`;
      return;
    }

    // List of important security headers                    ⚠️ Critical                🟡 Moderate                 🟢 Low
    const checks = {
      'strict-transport-security': {
        present: '[ ⚠️ ] It tells the browser to always use secure HTTPS connections for the website. This protects users by enforcing encryption and preventing any accidental or forced downgrades to an insecure HTTP connection.',
        missing: '[ ⚠️ ] The site is more vulnerable to attacks like man-in-the-middle or downgrade attacks, especially in unsecured networks. Users might unknowingly access the site over HTTP, risking exposure of sensitive information.'
      },
      'permissions-policy': {
        present: '[ 🟡 ] It restricts access to powerful browser features (like camera, geolocation, fullscreen) for the page or embedded content, helping to reduce the risk of abuse and protect user privacy.',
        missing: '[ 🟡 ] Any embedded content (like iframes or third-party scripts) might access sensitive browser features without restriction, increasing the attack surface.'
      },
      'content-security-policy': {
        present: '[ ⚠️ ] It defines which sources the browser should trust and allow for loading content like scripts, styles, images, and more. This helps prevent Cross-Site Scripting (XSS), data injection attacks, and mitigates code execution from untrusted sources.',
        missing: '[ ⚠️ ] The browser does not restrict what content can be loaded or executed. This leaves the application vulnerable to XSS, malicious script injection, data leaks, and other client-side attacks.'
      },
      'content-security-policy-report-only': {
        present: '[ 🟢 ] It monitors what would happen if a CSP (Content-Security-Policy) was enforced, but it does not block anything. Instead, it logs violations to a specified endpoint, helping developers test policies before full enforcement.',
        missing: '[ 🟢 ] There’s no safe way to test potential CSP rules without risking functionality. This may delay the adoption of a secure CSP policy or lead to breakages when CSP is suddenly enforced without testing.'
      },
      'x-content-type-options': {
        present: '[ ⚠️ ] When this header is present and set to nosniff, it tells the browser not to automatically guess the content type of a response. This prevents the browser from interpreting files as a different content type (e.g., executing a file as JavaScript if it is actually an image)',
        missing: '[ ⚠️ ] If this header is missing, browsers may attempt to guess the content type, potentially allowing attackers to execute malicious code or perform other exploits.'
      },
      'x-frame-options': {
        present: '[ ⚠️ ] When this header is present, it controls whether a page can be embedded within an iframe, frame, or object tag. Common values include DENY (prevents all framing), SAMEORIGIN (only allows framing by the same origin), and ALLOW-FROM (allows framing from specific URLs).',
        missing: '[ ⚠️ ] If this header is missing, the page can be embedded in frames by any other page, which may lead to clickjacking attacks where a user interacts with hidden malicious content.'
      },
      'x-xss-protection': {
        present: '[ 🟡 ] When this header is set to 1; mode=block, it enables the browser`s built-in Cross-Site Scripting (XSS) filter. This filter will block the page from loading if it detects a potential XSS attack.',
        missing: '[ 🟡 ] If this header is missing, the browser`s XSS protection filter might not be applied, leaving the application vulnerable to certain types of XSS attacks.'
      },
      'referrer-policy': {
        present: '[ 🟡 ] When this header is present, it controls how much referrer information (the URL of the referring page) is sent with requests.',
        missing: '[ 🟡 ] If this header is missing, the default behavior may send full referrer information on all requests, which could potentially expose sensitive information about users` previous activities.'
      },
      'permissions-policy': {
        present: '[ ⚠️ ] When this header is present, it controls which web platform features can be used in the browser. This includes features like geolocation, camera access, microphone access, and fullscreen mode.',
        missing: '[ ⚠️ ] If this header is missing, it leaves platform features open to use by any origin, which may expose sensitive user data or allow unauthorized access to features (e.g., camera, microphone).'
      },
      'cross-origin-resource-policy': {
        present: '[ 🟡 ]  When this header is present, it controls which cross-origin resources can be shared with the requesting origin. It helps mitigate attacks like Cross-Origin Resource Sharing (CORS) misconfigurations.',
        missing: '[ 🟡 ]  If this header is missing, the browser might allow resources from any origin to be loaded, which increases the risk of exposing sensitive data to malicious sites.'
      },
      'cross-origin-embedder-policy': {
        present: '[ ⚠️ ] When this header is present, it controls whether or not a document can embed cross-origin resources (e.g., images, scripts, iframes).',
        missing: '[ ⚠️ ] If this header is missing, it allows embedding of cross-origin resources without any restrictions, which may lead to issues with content security and increase vulnerability to attacks like Spectre or Meltdown (in the case of shared resources).'
      },
      'cross-origin-opener-policy': {
        present: '[ ⚠️ ] When this header is present, it controls the interaction between the current document and other documents from different origins. ',
        missing: '[ ⚠️ ] If this header is missing, it may leave the document vulnerable to attacks involving cross-origin interactions, such as manipulating the window or document objects of another origin.'
      },
      'access-control-allow-origin': {
        present: '[ ⚠️ ] When this header is present, it defines which domains are allowed to access resources from the server (cross-origin requests).',
        missing: '[ ⚠️ ] If this header is missing, the browser will block the cross-origin request by default, resulting in a CORS (Cross-Origin Resource Sharing) error. It may prevent legitimate external resources from being accessed.'
      },
      'access-control-allow-credentials': {
        present: '[ 🟡 ] When this header is present and set to true, it allows cookies, authorization headers, or TLS client certificates to be sent with cross-origin requests. This is useful for requests requiring user authentication. ',
        missing: '[ 🟡 ] If this header is missing or set to false, credentials (like cookies or authentication headers) will not be sent with cross-origin requests, potentially breaking functionality that requires user authentication.'
      },
      'access-control-allow-methods': {
        present: '[ 🟡 ] When this header is present, it specifies which HTTP methods (like GET, POST, PUT, etc.) are allowed for cross-origin requests.',
        missing: '[ 🟡 ] If this header is missing, browsers may block the request or default to a limited set of methods (e.g., GET and POST), potentially preventing intended actions like PUT or DELETE.'
      },
      'access-control-allow-headers': {
        present: '[ 🟡 ] When this header is present, it specifies which HTTP headers are allowed to be included in the request during cross-origin requests.',
        missing: '[ 🟡 ] If this header is missing, browsers might block the request if it includes headers that are not considered safe by default (like Authorization), causing functionality to break.'
      },
      'access-control-expose-headers': {
        present: '[ 🟢 ] This header tells the browser which response headers should be exposed (i.e., readable) to the frontend JavaScript code in a cross-origin request. By default, only a few simple headers are accessible (Content-Type, etc.).',
        missing: '[ 🟢 ] If missing, only simple headers will be exposed. Custom headers like X-Custom-Token will not be accessible via JavaScript, possibly limiting functionality.'
      },
      'access-control-max-age': {
        present: '[ 🟢 ] This header defines how long (in seconds) the results of a preflight request (OPTIONS) can be cached by the browser.',
        missing: '[ 🟢 ] Without this header, the browser will make a preflight request before every actual request, which can increase load times and server strain.'
      },
      'cache-control': {
        present: '[ ⚠️ ] Controls how and for how long the browser and intermediary caches (like CDNs) store the response.',
        missing: '[ ⚠️ ] If not present, the browser may use default caching rules, which could lead to stale or insecure content being served.'
      },
      'etag': {
        present: '[ 🟡 ] Acts like a unique ID for a specific version of a resource. Helps with efficient caching and validation.',
        missing: '[ 🟡 ] The server can not validate cached versions, and the browser may re-download unchanged files.'
      },
      'last-modified': {
        present: '[ 🟢 ] Indicates the last time the resource was changed. Used with conditional requests (If-Modified-Since).',
        missing: '[ 🟢 ] Reduces caching efficiency since the browser can not validate if a resource has changed.'
      },
      'vary': {
        present: '[ 🟡 ] Informs caches which request headers should result in different cached responses.',
        missing: '[ 🟡 ] Can lead to incorrect content being served to users (e.g., cached HTML sent to an API request).'
      },
      'clear-site-data': {
        present: '[ ⚠️ ] Instructs the browser to clear stored data (cookies, localStorage, cache) when the response is received.',
        missing: '[ ⚠️ ] The site may retain old data across logouts or major changes, potentially leading to security or usability issues.'
      },
      'set-cookie': {
        present: '[ ⚠️ ] The server stores important information (like session IDs or preferences) on the client through cookies. It can also define security settings like Secure, HttpOnly, and SameSite to protect the cookie.',
        missing: '[ ⚠️ ] Sessions, login states, and user preferences may not be saved, leading to broken authentication or a bad user experience. Security protections tied to cookies may not be applied, increasing the risk of attacks like session hijacking or CSRF.'
      },






















    };
    let missing = [];
    let present = [];

    for (let header in checks) {
      if (headers[header]) {
        present.push({ header, description: checks[header].present });
      } else {
        missing.push({ header, description: checks[header].missing });
      }
    }



    

  resultDiv.innerHTML = `
  <div class="result-container" id="result-container">
    <h2 id="result-title">
      Results for <span style="color:rgb(0, 0, 0);">${url}</span>
    </h2>

    <h3 class="missing-title">
      ❌ Missing Security Headers [ ⚠️ Critical ---> 🟡 Moderate ---> 🟢 Low ]
    </h3>
    <ul class="header-list missing" id="missing-list">
      ${
        missing.length > 0
          ? missing.map(m => `<li style="margin-bottom: 1em;"><strong>${m.header}</strong><br><span>${m.description}</span></li>`).join('')
          : '<li>All important headers are present!</li>'
      }
    </ul>

    <h3 class="present-title">
      ✅ Present Security Headers [ ⚠️ Critical ---> 🟡 Moderate ---> 🟢 Low ]
    </h3>
    <ul class="header-list present" id="present-list">
      ${present.map(p => `<li style="margin-bottom: 1em;"><strong>${p.header}</strong><br><span>${p.description}</span></li>`).join('')}
    </ul>
  </div>
`;




     

  } catch (error) {
    console.error(error);
    loading.classList.add('hidden');
    resultDiv.innerHTML = `<div class="error-message">❌ Unexpected error occurred. Please check the console for details.</div>`;
  }
}