const canvas = document.getElementById('diagram');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('angle-slider');
const readout = document.getElementById('readout');

const O = { x: 220, y: 240 };
const rO = 150;
const OPrime = { x: 480, y: 230 };
const rOPrime = 170;

const intersections = circleIntersections(O, rO, OPrime, rOPrime);
const A = intersections.top;
const B = intersections.bottom;

slider.addEventListener('input', () => {
  render(parseFloat(slider.value));
});

render(parseFloat(slider.value));

function render(angleDeg) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  const theta = (angleDeg * Math.PI) / 180;
  const direction = { x: Math.cos(theta), y: Math.sin(theta) };

  const M = lineCircleOtherIntersection(B, direction, O, rO);
  const N = lineCircleOtherIntersection(B, direction, OPrime, rOPrime);

  const MPrime = reflectThroughCenter(M, O);
  const NPrime = reflectThroughCenter(N, OPrime);
  const P = lineIntersection(O, M, OPrime, N);

  drawCircle(O, rO, '#3a7afe');
  drawCircle(OPrime, rOPrime, '#f36d9e');

  drawLineThrough(B, direction, '#30303d');
  drawSegment(O, M, '#3a7afe');
  drawSegment(OPrime, N, '#f36d9e');
  drawSegment(M, N, 'rgba(0,0,0,0.45)', [8, 4]);
  drawSegment(A, P, 'rgba(0,0,0,0.2)');
  drawSegment(O, OPrime, 'rgba(0,0,0,0.25)');

  drawPoint(A, 'A');
  drawPoint(B, 'B');
  drawPoint(M, 'M');
  drawPoint(N, 'N');
  drawPoint(MPrime, "M'");
  drawPoint(NPrime, "N'");
  drawPoint(O, 'O');
  drawPoint(OPrime, "O'");
  if (P) {
    drawPoint(P, 'P');
  }

  updateReadout({ angleDeg, M, N, MPrime, NPrime, P });
}

function drawBackground() {
  ctx.fillStyle = '#fdfbff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCircle(center, radius, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLineThrough(point, dir, color) {
  const scale = 2000;
  const p1 = { x: point.x - dir.x * scale, y: point.y - dir.y * scale };
  const p2 = { x: point.x + dir.x * scale, y: point.y + dir.y * scale };
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([6, 4]);
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawSegment(p1, p2, color, dash = []) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.setLineDash(dash);
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPoint(point, label) {
  ctx.beginPath();
  ctx.fillStyle = '#1c1b20';
  ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1b20';
  ctx.font = '15px Inter';
  ctx.fillText(label, point.x + 8, point.y - 8);
}

function reflectThroughCenter(point, center) {
  return {
    x: 2 * center.x - point.x,
    y: 2 * center.y - point.y,
  };
}

function circleIntersections(c1, r1, c2, r2) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.hypot(dx, dy);
  const a = (r1 ** 2 - r2 ** 2 + d ** 2) / (2 * d);
  const hSq = r1 ** 2 - a ** 2;
  const h = Math.sqrt(Math.max(hSq, 0));
  const mx = c1.x + (a * dx) / d;
  const my = c1.y + (a * dy) / d;
  const rx = (-dy * h) / d;
  const ry = (dx * h) / d;

  const p1 = { x: mx + rx, y: my + ry };
  const p2 = { x: mx - rx, y: my - ry };

  return p1.y < p2.y
    ? { top: p1, bottom: p2 }
    : { top: p2, bottom: p1 };
}

function lineCircleOtherIntersection(basePoint, direction, center, radius) {
  const dir = normalize(direction);
  const f = { x: basePoint.x - center.x, y: basePoint.y - center.y };
  const a = dir.x * dir.x + dir.y * dir.y;
  const b = 2 * (dir.x * f.x + dir.y * f.y);
  const c = f.x * f.x + f.y * f.y - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return basePoint;
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-b + sqrtDisc) / (2 * a);
  const t2 = (-b - sqrtDisc) / (2 * a);

  const candidate = Math.abs(t1) > 1e-6 ? t1 : t2;

  return {
    x: basePoint.x + dir.x * candidate,
    y: basePoint.y + dir.y * candidate,
  };
}

function lineIntersection(a1, a2, b1, b2) {
  const r = { x: a2.x - a1.x, y: a2.y - a1.y };
  const s = { x: b2.x - b1.x, y: b2.y - b1.y };
  const denom = cross(r, s);

  if (Math.abs(denom) < 1e-6) {
    return null;
  }

  const u = cross({ x: b1.x - a1.x, y: b1.y - a1.y }, r) / denom;

  return {
    x: b1.x + u * s.x,
    y: b1.y + u * s.y,
  };
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function cross(v1, v2) {
  return v1.x * v2.y - v1.y * v2.x;
}

function dot(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
}

function orientedAngle(u, v) {
  const nu = normalize(u);
  const nv = normalize(v);
  return Math.atan2(cross(nu, nv), dot(nu, nv));
}

function normalizeModulo(angle, modulus) {
  const twoPi = modulus;
  let normalized = angle % twoPi;
  if (normalized < 0) {
    normalized += twoPi;
  }
  return normalized;
}

function updateReadout({ angleDeg, M, N, MPrime, NPrime, P }) {
  const twoPi = Math.PI * 2;
  const AM = { x: M.x - A.x, y: M.y - A.y };
  const AN = { x: N.x - A.x, y: N.y - A.y };
  const AO = { x: O.x - A.x, y: O.y - A.y };
  const AOPrime = { x: OPrime.x - A.x, y: OPrime.y - A.y };

  const angleMAN = orientedAngle(AM, AN);
  const angleAOAOPrime = orientedAngle(AO, AOPrime);

  const lhs1 = normalizeModulo(2 * angleMAN, twoPi);
  const rhs1 = normalizeModulo(2 * angleAOAOPrime, twoPi);
  const diff1 = Math.abs(lhs1 - rhs1);

  const BMPrime = { x: MPrime.x - B.x, y: MPrime.y - B.y };
  const BNPrime = { x: NPrime.x - B.x, y: NPrime.y - B.y };
  const denom = Math.hypot(BMPrime.x, BMPrime.y) * Math.hypot(BNPrime.x, BNPrime.y) || 1;
  const colinearity = Math.abs(cross(BMPrime, BNPrime)) / denom;

  const rhs2 = normalizeModulo(angleAOAOPrime, Math.PI);
  const anglePOPPrime = P
    ? Math.abs(
        normalizeModulo(
          orientedAngle({ x: O.x - P.x, y: O.y - P.y }, { x: OPrime.x - P.x, y: OPrime.y - P.y }),
          Math.PI
        )
      )
    : null;
  const diff2 = anglePOPPrime !== null ? Math.abs(anglePOPPrime - rhs2) : null;

  readout.innerHTML = `
    <div><strong>Orientation de &Delta; :</strong> ${angleDeg.toFixed(0)}&deg;</div>
    <div><strong>2(AM, AN) :</strong> ${(lhs1 * 180 / Math.PI).toFixed(2)}&deg; &nbsp;|&nbsp; <strong>2(AO, AO')</strong> ${(rhs1 * 180 / Math.PI).toFixed(2)}&deg;</div>
    <div><strong>Écart (mod 2π) :</strong> ${(Math.min(diff1, twoPi - diff1) * 180 / Math.PI).toExponential(2)}&deg;</div>
    <div><strong>Alignement de B, M', N'</strong> (aire normalisée) : ${colinearity.toExponential(2)}</div>
    <div><strong>(PO, PO')</strong> (mod π) : ${formatAngle(anglePOPPrime)} &nbsp;|&nbsp; <strong>(AO, AO')</strong> ${(rhs2 * 180 / Math.PI).toFixed(2)}&deg;</div>
    <div><strong>Écart (mod π) :</strong> ${formatAngle(diff2, true)}</div>
  `;
}

function formatAngle(angle, exponential = false) {
  if (angle === null || Number.isNaN(angle)) {
    return '&mdash;';
  }
  const value = (angle * 180) / Math.PI;
  return exponential ? `${value.toExponential(2)}&deg;` : `${value.toFixed(2)}&deg;`;
}
