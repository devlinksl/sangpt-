import React from 'react';

const styles = `
  .ob-root {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: hsl(var(--background), 100%);
    padding: 24px;
    box-sizing: border-box;
  }
  .ob-center {
    text-align: center;
  }
  .ob-logo {
    width: 140px;
    height: auto;
    margin-bottom: 18px;
  }
  .ob-wordmark {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 36px;
    color: hsl(var(--foreground));
    margin: 0;
  }
`;

export const Onboarding = () => {
  return (
    <>
      <style>{styles}</style>

      <div className="ob-root">
        <div className="ob-center">
          <img className="ob-logo" src="/home-logo.png" alt="SanGPT logo" />
          <h1 className="ob-wordmark">SanGPT</h1>
        </div>
      </div>
    </>
  );
};

export default Onboarding;
