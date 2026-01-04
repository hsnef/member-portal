export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-saffron-50 to-orange-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-saffron-700 mb-4">
          HSNEF Membership Portal
        </h1>
        <p className="text-gray-700 text-lg">
          Hindu Society of North East Florida
        </p>
        <div className="mt-8 space-x-4">
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition"
          >
            Member Login
          </a>
          <a
            href="https://hsnef.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-maroon-700 text-white rounded-lg hover:bg-maroon-800 transition"
          >
            Visit Main Website
          </a>
        </div>
      </div>
    </div>
  );
}
