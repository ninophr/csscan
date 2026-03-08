export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold mb-3">Paiement reçu !</h1>
        <p className="text-gray-400 mb-8">
          Ton rapport complet est en cours de génération. Tu le recevras par email dans quelques minutes.
        </p>
        <a
          href="/"
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg font-semibold transition inline-block"
        >
          Scanner un autre site
        </a>
      </div>
    </main>
  );
}
