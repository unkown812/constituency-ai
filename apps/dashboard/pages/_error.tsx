import { NextPage, NextPageContext } from "next";

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily:
          'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 500,
            margin: 0,
            paddingRight: 16,
            borderRight: "1px solid rgba(0,0,0,0.3)",
          }}
        >
          {statusCode}
        </h1>
        <p style={{ fontSize: 14, margin: 0 }}>
          {statusCode === 404
            ? "This page could not be found"
            : "An unexpected error has occurred"}
        </p>
      </div>
    </div>
  );
};

Error.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res
    ? res.statusCode
    : err
      ? err.statusCode ?? 500
      : 404;
  return { statusCode };
};

export default Error;
