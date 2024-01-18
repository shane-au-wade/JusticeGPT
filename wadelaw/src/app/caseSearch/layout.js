import '.././globals.css'


export const metadata = {
  title: 'Case Search',
  description: 'Access LA Courthouse Crimal Cases',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
