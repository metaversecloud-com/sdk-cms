import { ReactNode, useContext, useState } from "react";

// components
import { AdminView, AdminIconButton, Loading } from "@/components";

// context
import { GlobalStateContext } from "@context/GlobalContext";

export const PageContainer = ({
  children,
  isLoading,
  headerText,
  adminHeaderText,
}: {
  children: ReactNode;
  isLoading: boolean;
  headerText?: string;
  adminHeaderText?: string;
}) => {
  const { error, isAdmin } = useContext(GlobalStateContext);
  const [showSettings, setShowSettings] = useState(false);

  if (isLoading) return <Loading />;

  const displayHeaderText = showSettings ? adminHeaderText : headerText;

  return (
    <div className="p-4 mb-28">
      {isAdmin && (
        <div>
          <AdminIconButton setShowSettings={() => setShowSettings(!showSettings)} showSettings={showSettings} />
        </div>
      )}
      {displayHeaderText && (
        <div className="pb-6">
          <h2>{displayHeaderText}</h2>
        </div>
      )}
      {showSettings ? (
        <AdminView />
      ) : (
        <>
          {children}
          {error && <p className="p3 pt-10 text-center text-error">{error}</p>}
        </>
      )}
    </div>
  );
};

export default PageContainer;
