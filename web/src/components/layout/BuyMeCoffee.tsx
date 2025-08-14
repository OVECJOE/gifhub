import Script from 'next/script'

export function BuyMeCoffee() {
  return (
    <Script
      src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
      data-name="BMC-Widget"
      data-cfasync="false"
      data-id="misterlyserious"
      data-description="Support me on Buy me a coffee!"
      data-message="Hello, please buy me a coffee to support my work and encourage me to develop new solutions. It will make my heart glad and will inspire my hands to craft masterfully and creatively to produce more tools that make people's lives easier."
      data-color="#FF813F"
      data-position="Right"
      data-x_margin="18"
      data-y_margin="18"
      strategy="lazyOnload"
    />
  )
}
