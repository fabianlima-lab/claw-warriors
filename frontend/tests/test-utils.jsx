import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../messages/en.json';

export function renderWithIntl(ui, { locale = 'en', ...options } = {}) {
  function Wrapper({ children }) {
    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { renderWithIntl as render };
