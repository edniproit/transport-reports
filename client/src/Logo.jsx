import bandUrl from './assets/band.svg';
import logoBlueUrl from './assets/logo-blue.svg';
import shieldUrl from './assets/shield.svg';

// Графіка взята з макета звіту (client/src/assets), нічого не перемальовано.
export const Logo = ({ className = '' }) => <img className={`logo ${className}`} src={logoBlueUrl} alt="єДніпро" />;

export const Shield = () => <img className="shield" src={shieldUrl} alt="" />;

// Синя смуга шапки: логотип і піктограми транспорту.
export const Band = () => <img className="sheet-band" src={bandUrl} alt="єДніпро" />;
