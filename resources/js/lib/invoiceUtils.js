// Utility to download invoice PDF with loading state
export const downloadInvoicePdf = (invoiceId, setLoading) => {
    setLoading(true);
    setTimeout(() => {
        window.location.href = `/invoices/${invoiceId}/pdf`;
        setLoading(false);
    }, 2000);
}; 