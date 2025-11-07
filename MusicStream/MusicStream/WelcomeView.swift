import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showLogin = false
    
    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()
            
            VStack(spacing: 50) {
                Spacer()
                
                VStack(spacing: 24) {
                    Image(systemName: "waveform")
                        .font(.system(size: 60, weight: .thin))
                        .foregroundColor(.white)
                    
                    Text("MusicStream")
                        .font(.system(size: 40, weight: .thin))
                        .foregroundColor(.white)
                        .tracking(2)
                    
                    Text("110M+ songs in HiFi")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.6))
                        .fontWeight(.light)
                }
                
                Spacer()
                
                VStack(spacing: 12) {
                    Button(action: {
                        showLogin = true
                    }) {
                        Text("Sign In")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.white)
                            .cornerRadius(8)
                    }
                    
                    Button(action: {
                        authViewModel.signUpWithEmail()
                    }) {
                        Text("Create Account")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
                            )
                    }
                    
                    Button(action: {
                        authViewModel.continueAsGuest()
                    }) {
                        Text("Continue as Guest")
                            .font(.system(size: 14, weight: .regular))
                            .foregroundColor(.white.opacity(0.6))
                            .padding(.top, 8)
                    }
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 60)
            }
        }
        .sheet(isPresented: $showLogin) {
            LoginView()
                .environmentObject(authViewModel)
        }
    }
}
