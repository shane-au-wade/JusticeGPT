import '.././globals.css'

export const metadata = {
  title: 'Case Search',
  description: 'Access LA Courthouse Crimal Cases',
}

export default function Layout({ children }) {
  return (
    <div
      style={{
        height: '100%',
      }}
    >
      {children}
    </div>
  )
}
